/**
 * Friend-graph service. Friendship is symmetric (mutual) and mirrored on both
 * users for fast reads. Pending requests live in incoming/outgoing
 * subcollections on each side. All mutations are transactional so the two sides
 * never drift. Every write goes through the Admin SDK (rules deny client access).
 */
import { FieldValue, Transaction } from "firebase-admin/firestore";
import { db } from "../config/firebase";
import { AuthedUser } from "../http/middleware/auth";
import { badRequest, conflict, forbidden, notFound } from "../http/errors";
import {
  Friend,
  FriendRequestCard,
  PublicProfile,
  Relationship,
} from "../domain/types";
import { ensureProfile } from "./social.service";

const profilesCol = () => db.collection("profiles");
const userDoc = (uid: string) => db.collection("users").doc(uid);
const friendsCol = (uid: string) => userDoc(uid).collection("friends");
const incomingCol = (uid: string) => userDoc(uid).collection("incomingRequests");
const outgoingCol = (uid: string) => userDoc(uid).collection("outgoingRequests");
const blocksCol = (uid: string) => userDoc(uid).collection("blocks");

function now(): number {
  return Date.now();
}

function friendCard(p: PublicProfile, since: number): Friend {
  return {
    uid: p.uid,
    handle: p.handle,
    displayName: p.displayName,
    photoURL: p.photoURL,
    since,
  };
}

async function getProfileOr404(uid: string): Promise<PublicProfile> {
  const snap = await profilesCol().doc(uid).get();
  if (!snap.exists) throw notFound("User not found.");
  return snap.data() as PublicProfile;
}

/** Compute the viewer's relationship to another user (≤5 point reads). */
export async function getRelationship(
  viewerUid: string,
  otherUid: string,
): Promise<Relationship> {
  if (viewerUid === otherUid) return "self";
  const [fr, out, inc, blk, blkBy] = await Promise.all([
    friendsCol(viewerUid).doc(otherUid).get(),
    outgoingCol(viewerUid).doc(otherUid).get(),
    incomingCol(viewerUid).doc(otherUid).get(),
    blocksCol(viewerUid).doc(otherUid).get(),
    blocksCol(otherUid).doc(viewerUid).get(),
  ]);
  if (blk.exists) return "blocked";
  if (blkBy.exists) return "blocked_by";
  if (fr.exists) return "friends";
  if (out.exists) return "outgoing_pending";
  if (inc.exists) return "incoming_pending";
  return "none";
}

export interface SearchResult extends PublicProfile {
  relationship: Relationship;
}

/** Prefix-search public profiles by handle, annotated with relationship. */
export async function searchUsers(
  viewer: AuthedUser,
  q: string,
): Promise<SearchResult[]> {
  const snap = await profilesCol()
    .orderBy("handleLower")
    .startAt(q)
    .endAt(q + "")
    .limit(20)
    .get();

  const results: SearchResult[] = [];
  for (const doc of snap.docs) {
    const p = doc.data() as PublicProfile;
    if (p.uid === viewer.uid) continue;
    const relationship = await getRelationship(viewer.uid, p.uid);
    if (relationship === "blocked_by") continue; // invisible to people who blocked me
    results.push({ ...p, relationship });
  }
  return results;
}

/** Create both sides of a friendship and clear any pending requests + bump counts. */
function writeFriendship(tx: Transaction, a: PublicProfile, b: PublicProfile): void {
  const ts = now();
  tx.set(friendsCol(a.uid).doc(b.uid), friendCard(b, ts));
  tx.set(friendsCol(b.uid).doc(a.uid), friendCard(a, ts));
  tx.delete(outgoingCol(a.uid).doc(b.uid));
  tx.delete(incomingCol(a.uid).doc(b.uid));
  tx.delete(outgoingCol(b.uid).doc(a.uid));
  tx.delete(incomingCol(b.uid).doc(a.uid));
  tx.update(profilesCol().doc(a.uid), {
    friendCount: FieldValue.increment(1),
    updatedAt: ts,
  });
  tx.update(profilesCol().doc(b.uid), {
    friendCount: FieldValue.increment(1),
    updatedAt: ts,
  });
}

export type SendRequestResult =
  | "requested"
  | "accepted"
  | "already_pending";

/**
 * Send a friend request. If the target already requested the caller, the two
 * become friends immediately (reverse-request auto-accept).
 */
export async function sendRequest(
  fromUser: AuthedUser,
  toUid: string,
): Promise<SendRequestResult> {
  if (toUid === fromUser.uid) throw badRequest("You can't friend yourself.");
  await ensureProfile(fromUser);
  await getProfileOr404(toUid);

  return db.runTransaction(async (tx) => {
    const meRef = profilesCol().doc(fromUser.uid);
    const themRef = profilesCol().doc(toUid);
    const [
      meSnap,
      themSnap,
      friendSnap,
      outSnap,
      incSnap,
      myBlock,
      theirBlock,
    ] = await Promise.all([
      tx.get(meRef),
      tx.get(themRef),
      tx.get(friendsCol(fromUser.uid).doc(toUid)),
      tx.get(outgoingCol(fromUser.uid).doc(toUid)),
      tx.get(incomingCol(fromUser.uid).doc(toUid)),
      tx.get(blocksCol(fromUser.uid).doc(toUid)),
      tx.get(blocksCol(toUid).doc(fromUser.uid)),
    ]);

    if (myBlock.exists) throw badRequest("Unblock this user first.");
    if (theirBlock.exists) throw forbidden("You can't send this request.");
    if (friendSnap.exists) throw conflict("You're already friends.");

    const me = meSnap.data() as PublicProfile;
    const them = themSnap.data() as PublicProfile;

    // They already requested me → become friends now.
    if (incSnap.exists) {
      writeFriendship(tx, me, them);
      return "accepted";
    }
    if (outSnap.exists) return "already_pending";

    const ts = now();
    tx.set(outgoingCol(fromUser.uid).doc(toUid), {
      uid: toUid,
      handle: them.handle,
      displayName: them.displayName,
      photoURL: them.photoURL,
      createdAt: ts,
    });
    tx.set(incomingCol(toUid).doc(fromUser.uid), {
      uid: fromUser.uid,
      handle: me.handle,
      displayName: me.displayName,
      photoURL: me.photoURL,
      createdAt: ts,
    });
    return "requested";
  });
}

/** Accept an incoming request from `fromUid`. */
export async function acceptRequest(
  user: AuthedUser,
  fromUid: string,
): Promise<Friend> {
  await ensureProfile(user);
  return db.runTransaction(async (tx) => {
    const [incSnap, meSnap, themSnap] = await Promise.all([
      tx.get(incomingCol(user.uid).doc(fromUid)),
      tx.get(profilesCol().doc(user.uid)),
      tx.get(profilesCol().doc(fromUid)),
    ]);
    if (!incSnap.exists) throw notFound("No pending request from this user.");
    if (!themSnap.exists) throw notFound("User not found.");
    const me = meSnap.data() as PublicProfile;
    const them = themSnap.data() as PublicProfile;
    writeFriendship(tx, me, them);
    return friendCard(them, now());
  });
}

/** Decline an incoming request (removes both mirror docs). */
export async function declineRequest(
  user: AuthedUser,
  fromUid: string,
): Promise<void> {
  const batch = db.batch();
  batch.delete(incomingCol(user.uid).doc(fromUid));
  batch.delete(outgoingCol(fromUid).doc(user.uid));
  await batch.commit();
}

/** Cancel an outgoing request the caller sent to `toUid`. */
export async function cancelRequest(
  user: AuthedUser,
  toUid: string,
): Promise<void> {
  const batch = db.batch();
  batch.delete(outgoingCol(user.uid).doc(toUid));
  batch.delete(incomingCol(toUid).doc(user.uid));
  await batch.commit();
}

export async function listFriends(uid: string): Promise<Friend[]> {
  const snap = await friendsCol(uid).orderBy("since", "desc").get();
  return snap.docs.map((d) => d.data() as Friend);
}

export async function listRequests(
  uid: string,
): Promise<{ incoming: FriendRequestCard[]; outgoing: FriendRequestCard[] }> {
  const [inc, out] = await Promise.all([
    incomingCol(uid).orderBy("createdAt", "desc").get(),
    outgoingCol(uid).orderBy("createdAt", "desc").get(),
  ]);
  return {
    incoming: inc.docs.map((d) => d.data() as FriendRequestCard),
    outgoing: out.docs.map((d) => d.data() as FriendRequestCard),
  };
}

/** Remove a friendship from both sides and decrement both counts. */
export async function unfriend(
  user: AuthedUser,
  friendUid: string,
): Promise<void> {
  await db.runTransaction(async (tx) => {
    const aSnap = await tx.get(friendsCol(user.uid).doc(friendUid));
    if (!aSnap.exists) throw notFound("You're not friends with this user.");
    const ts = now();
    tx.delete(friendsCol(user.uid).doc(friendUid));
    tx.delete(friendsCol(friendUid).doc(user.uid));
    tx.update(profilesCol().doc(user.uid), {
      friendCount: FieldValue.increment(-1),
      updatedAt: ts,
    });
    tx.update(profilesCol().doc(friendUid), {
      friendCount: FieldValue.increment(-1),
      updatedAt: ts,
    });
  });
}

/** Block a user: severs any friendship + pending requests and hides both ways. */
export async function blockUser(
  user: AuthedUser,
  targetUid: string,
): Promise<void> {
  if (targetUid === user.uid) throw badRequest("You can't block yourself.");
  await ensureProfile(user);
  await getProfileOr404(targetUid);

  await db.runTransaction(async (tx) => {
    const friendSnap = await tx.get(friendsCol(user.uid).doc(targetUid));
    const ts = now();
    tx.set(blocksCol(user.uid).doc(targetUid), { uid: targetUid, createdAt: ts });
    tx.delete(friendsCol(user.uid).doc(targetUid));
    tx.delete(friendsCol(targetUid).doc(user.uid));
    tx.delete(outgoingCol(user.uid).doc(targetUid));
    tx.delete(incomingCol(user.uid).doc(targetUid));
    tx.delete(outgoingCol(targetUid).doc(user.uid));
    tx.delete(incomingCol(targetUid).doc(user.uid));
    if (friendSnap.exists) {
      tx.update(profilesCol().doc(user.uid), {
        friendCount: FieldValue.increment(-1),
        updatedAt: ts,
      });
      tx.update(profilesCol().doc(targetUid), {
        friendCount: FieldValue.increment(-1),
        updatedAt: ts,
      });
    }
  });
}

export async function unblockUser(
  user: AuthedUser,
  targetUid: string,
): Promise<void> {
  await blocksCol(user.uid).doc(targetUid).delete();
}

/** Blocked users the caller manages (enriched with current profile cards). */
export async function listBlocks(uid: string): Promise<FriendRequestCard[]> {
  const snap = await blocksCol(uid).orderBy("createdAt", "desc").get();
  const out: FriendRequestCard[] = [];
  for (const d of snap.docs) {
    const targetUid = d.get("uid") as string;
    const createdAt = d.get("createdAt") as number;
    const pSnap = await profilesCol().doc(targetUid).get();
    const p = pSnap.exists ? (pSnap.data() as PublicProfile) : null;
    out.push({
      uid: targetUid,
      handle: p?.handle ?? null,
      displayName: p?.displayName ?? null,
      photoURL: p?.photoURL ?? null,
      createdAt,
    });
  }
  return out;
}
