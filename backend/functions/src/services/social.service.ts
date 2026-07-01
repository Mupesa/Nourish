/**
 * Social service. Owns the PUBLIC profile (profiles/{uid}) and the unique
 * handle index (handles/{handleLower}). Kept separate from profile.service so
 * private calorie data in users/{uid} is never exposed to friends. All writes
 * go through the Admin SDK (rules deny client writes).
 */
import { db } from "../config/firebase";
import { AuthedUser } from "../http/middleware/auth";
import { conflict, notFound } from "../http/errors";
import { FriendStreak, PublicProfile } from "../domain/types";
import { applyCook } from "../domain/streak";
import { ClaimHandleInput, SocialProfileUpdateInput } from "../domain/validation";

const profilesCol = () => db.collection("profiles");
const handlesCol = () => db.collection("handles");

const ZERO_STREAK: FriendStreak = {
  current: 0,
  longest: 0,
  lastCookedDate: null,
};

function now(): number {
  return Date.now();
}

/**
 * Read the caller's public profile, creating a blank one (seeded from the auth
 * token) on first access. Idempotent — safe to call before any social action.
 */
export async function ensureProfile(user: AuthedUser): Promise<PublicProfile> {
  const ref = profilesCol().doc(user.uid);
  const snap = await ref.get();
  if (snap.exists) return snap.data() as PublicProfile;

  const profile: PublicProfile = {
    uid: user.uid,
    handle: null,
    handleLower: null,
    displayName: user.name,
    photoURL: user.picture,
    bio: "",
    streak: ZERO_STREAK,
    postCount: 0,
    friendCount: 0,
    createdAt: now(),
    updatedAt: now(),
  };
  await ref.set(profile);
  return profile;
}

/** GET /social/me — the caller's own public profile. */
export async function getMyProfile(user: AuthedUser): Promise<PublicProfile> {
  return ensureProfile(user);
}

/**
 * Claim (or change) the caller's unique handle. Uniqueness is enforced
 * atomically via a transaction on handles/{handleLower}; a previous handle is
 * released in the same transaction.
 */
export async function claimHandle(
  user: AuthedUser,
  input: ClaimHandleInput,
): Promise<PublicProfile> {
  await ensureProfile(user);
  const uid = user.uid;
  const handleLower = input.handle; // already trimmed + lowercased by zod
  const profileRef = profilesCol().doc(uid);
  const newHandleRef = handlesCol().doc(handleLower);

  return db.runTransaction(async (tx) => {
    // All reads first.
    const handleSnap = await tx.get(newHandleRef);
    const profileSnap = await tx.get(profileRef);

    if (handleSnap.exists && handleSnap.get("uid") !== uid) {
      throw conflict("That handle is already taken.");
    }

    const profile = profileSnap.data() as PublicProfile;
    const oldLower = profile.handleLower;

    // Release the previously-held handle when switching.
    if (oldLower && oldLower !== handleLower) {
      tx.delete(handlesCol().doc(oldLower));
    }

    tx.set(newHandleRef, { uid, handle: handleLower, createdAt: now() });
    tx.set(
      profileRef,
      { handle: handleLower, handleLower, updatedAt: now() },
      { merge: true },
    );

    return { ...profile, handle: handleLower, handleLower, updatedAt: now() };
  });
}

/** Update mutable public-profile fields (display name, bio, photo). */
export async function updateSocialProfile(
  user: AuthedUser,
  input: SocialProfileUpdateInput,
): Promise<PublicProfile> {
  await ensureProfile(user);
  const ref = profilesCol().doc(user.uid);

  const patch: Record<string, unknown> = { updatedAt: now() };
  if (input.displayName !== undefined) patch.displayName = input.displayName;
  if (input.bio !== undefined) patch.bio = input.bio;
  if (input.photoURL !== undefined) patch.photoURL = input.photoURL;

  await ref.set(patch, { merge: true });
  const snap = await ref.get();
  return snap.data() as PublicProfile;
}

/** Fetch any user's public profile by uid, or 404. */
export async function getPublicProfile(uid: string): Promise<PublicProfile> {
  const snap = await profilesCol().doc(uid).get();
  if (!snap.exists) throw notFound("User not found.");
  return snap.data() as PublicProfile;
}

/**
 * Record that the user logged a meal on `date` (YYYY-MM-DD), advancing their
 * cooking streak. Upserts a minimal public profile if none exists yet so
 * streaks work even for users who haven't touched social features.
 */
export async function recordCookDay(uid: string, date: string): Promise<void> {
  const ref = profilesCol().doc(uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const ts = now();
    const base: PublicProfile = snap.exists
      ? (snap.data() as PublicProfile)
      : {
          uid,
          handle: null,
          handleLower: null,
          displayName: null,
          photoURL: null,
          bio: "",
          streak: ZERO_STREAK,
          postCount: 0,
          friendCount: 0,
          createdAt: ts,
          updatedAt: ts,
        };
    const streak = applyCook(base.streak ?? ZERO_STREAK, date);
    tx.set(ref, { ...base, streak, updatedAt: ts }, { merge: true });
  });
}
