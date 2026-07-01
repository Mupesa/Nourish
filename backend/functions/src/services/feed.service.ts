/**
 * Feed service. Owns posts/{postId} — the persistent, friends-only "Cooked
 * Today" feed. Reads are friends-of-the-caller + self. All access goes through
 * the Admin SDK (rules deny client access to posts), so friendship is enforced
 * here in code. Likes arrive in stage 3.3.
 */
import { FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { db } from "../config/firebase";
import { AuthedUser } from "../http/middleware/auth";
import { badRequest, forbidden, notFound } from "../http/errors";
import { FeedPost, Post, Report, ReportReason } from "../domain/types";
import { CreatePostInput, ReportPostInput } from "../domain/validation";
import { ensureProfile } from "./social.service";

const postsCol = () => db.collection("posts");
const profilesCol = () => db.collection("profiles");
const reportsCol = () => db.collection("reports");
const likesCol = (postId: string) => postsCol().doc(postId).collection("likes");
const friendsCol = (uid: string) =>
  db.collection("users").doc(uid).collection("friends");

/** Annotate posts with whether `viewerUid` has liked each one. */
async function annotateLikes(
  viewerUid: string,
  posts: Post[],
): Promise<FeedPost[]> {
  const liked = await Promise.all(
    posts.map((p) => likesCol(p.id).doc(viewerUid).get()),
  );
  return posts.map((p, i) => ({ ...p, likedByMe: liked[i].exists }));
}

const DEFAULT_FEED_LIMIT = 20;
/** Firestore caps `in` queries at 30 values. */
const IN_CHUNK = 30;

function now(): number {
  return Date.now();
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Create a post authored by the caller; bumps their public postCount. */
export async function createPost(
  user: AuthedUser,
  input: CreatePostInput,
): Promise<Post> {
  const me = await ensureProfile(user);
  const ref = postsCol().doc();
  const post: Post = {
    id: ref.id,
    authorUid: user.uid,
    authorHandle: me.handle,
    authorName: me.displayName,
    authorPhoto: me.photoURL,
    imageUrl: input.imageUrl,
    imagePath: input.imagePath,
    caption: input.caption,
    kcal: input.kcal,
    recipeId: input.recipeId,
    likeCount: 0,
    createdAt: now(),
  };
  await ref.set(post);
  await profilesCol()
    .doc(user.uid)
    .update({ postCount: FieldValue.increment(1), updatedAt: now() });
  return post;
}

/** Delete a post (author only). Best-effort removal of the Storage object. */
export async function deletePost(
  user: AuthedUser,
  postId: string,
): Promise<void> {
  const ref = postsCol().doc(postId);
  const snap = await ref.get();
  if (!snap.exists) throw notFound("Post not found.");
  const post = snap.data() as Post;
  if (post.authorUid !== user.uid) throw forbidden("Not your post.");

  await ref.delete();
  await profilesCol()
    .doc(user.uid)
    .update({ postCount: FieldValue.increment(-1), updatedAt: now() });

  // Best-effort: don't fail the request if the object/bucket is unavailable.
  try {
    await getStorage().bucket().file(post.imagePath).delete();
  } catch {
    // ignore — object may already be gone or storage emulator not running
  }
}

/** Posts by a single author, newest first (profile grid). */
export async function listUserPosts(
  viewerUid: string,
  authorUid: string,
  limit = 30,
): Promise<FeedPost[]> {
  const snap = await postsCol()
    .where("authorUid", "==", authorUid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return annotateLikes(viewerUid, snap.docs.map((d) => d.data() as Post));
}

/**
 * The caller's feed: posts from their friends + themselves, newest first.
 * Uses chunked `in` queries (friend lists are small for the MVP); a fan-out
 * model is the later scaling path.
 */
export async function listFeed(
  uid: string,
  opts: { before?: number; limit?: number } = {},
): Promise<FeedPost[]> {
  const limit = opts.limit ?? DEFAULT_FEED_LIMIT;
  const friendsSnap = await friendsCol(uid).get();
  const authorUids = [uid, ...friendsSnap.docs.map((d) => d.id)];

  const all: Post[] = [];
  for (const group of chunk(authorUids, IN_CHUNK)) {
    let q = postsCol()
      .where("authorUid", "in", group)
      .orderBy("createdAt", "desc");
    if (opts.before) q = q.where("createdAt", "<", opts.before);
    const snap = await q.limit(limit).get();
    all.push(...snap.docs.map((d) => d.data() as Post));
  }

  all.sort((a, b) => b.createdAt - a.createdAt);
  return annotateLikes(uid, all.slice(0, limit));
}

export interface LikeResult {
  likeCount: number;
  likedByMe: boolean;
}

/** Report a post for moderation. Deduped per (post, reporter); no self-reports. */
export async function reportPost(
  user: AuthedUser,
  postId: string,
  input: ReportPostInput,
): Promise<void> {
  const postSnap = await postsCol().doc(postId).get();
  if (!postSnap.exists) throw notFound("Post not found.");
  const post = postSnap.data() as Post;
  if (post.authorUid === user.uid) {
    throw badRequest("You can't report your own post.");
  }
  const id = `${postId}_${user.uid}`;
  const report: Report = {
    id,
    reporterUid: user.uid,
    postId,
    authorUid: post.authorUid,
    reason: input.reason as ReportReason,
    note: input.note,
    status: "open",
    createdAt: now(),
  };
  await reportsCol().doc(id).set(report);
}

/** Delete a post without the author check — for admin moderation. */
export async function adminDeletePost(postId: string): Promise<void> {
  const ref = postsCol().doc(postId);
  const snap = await ref.get();
  if (!snap.exists) return;
  const post = snap.data() as Post;
  await ref.delete();
  try {
    await profilesCol()
      .doc(post.authorUid)
      .update({ postCount: FieldValue.increment(-1), updatedAt: now() });
  } catch {
    // author profile may be gone; ignore
  }
  try {
    await getStorage().bucket().file(post.imagePath).delete();
  } catch {
    // object/bucket unavailable; ignore
  }
}

/** Like a post (idempotent). Maintains likeCount in the same transaction. */
export async function likePost(
  user: AuthedUser,
  postId: string,
): Promise<LikeResult> {
  const postRef = postsCol().doc(postId);
  const likeRef = likesCol(postId).doc(user.uid);
  return db.runTransaction(async (tx) => {
    const [postSnap, likeSnap] = await Promise.all([
      tx.get(postRef),
      tx.get(likeRef),
    ]);
    if (!postSnap.exists) throw notFound("Post not found.");
    const post = postSnap.data() as Post;
    if (likeSnap.exists) return { likeCount: post.likeCount, likedByMe: true };
    tx.set(likeRef, { createdAt: now() });
    tx.update(postRef, { likeCount: FieldValue.increment(1) });
    return { likeCount: post.likeCount + 1, likedByMe: true };
  });
}

/** Unlike a post (idempotent). */
export async function unlikePost(
  user: AuthedUser,
  postId: string,
): Promise<LikeResult> {
  const postRef = postsCol().doc(postId);
  const likeRef = likesCol(postId).doc(user.uid);
  return db.runTransaction(async (tx) => {
    const [postSnap, likeSnap] = await Promise.all([
      tx.get(postRef),
      tx.get(likeRef),
    ]);
    if (!postSnap.exists) throw notFound("Post not found.");
    const post = postSnap.data() as Post;
    if (!likeSnap.exists) return { likeCount: post.likeCount, likedByMe: false };
    tx.delete(likeRef);
    tx.update(postRef, {
      likeCount: FieldValue.increment(-1),
    });
    return { likeCount: Math.max(0, post.likeCount - 1), likedByMe: false };
  });
}
