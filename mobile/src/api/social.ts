/**
 * Social API client — public profiles + handle. Friend graph / feed clients are
 * added in later Phase 3 stages.
 */
import { api } from "./client";
import { PublicProfile, Relationship } from "../types/domain";

/** The caller's own public profile (created on the server if missing). */
export function getMyProfile(): Promise<PublicProfile> {
  return api
    .get<{ profile: PublicProfile }>("/api/v1/social/me")
    .then((r) => r.profile);
}

/** Claim or change the caller's unique @handle. */
export function claimHandle(handle: string): Promise<PublicProfile> {
  return api
    .put<{ profile: PublicProfile }>("/api/v1/social/handle", { handle })
    .then((r) => r.profile);
}

/** Update display name / bio / photo. */
export function updateSocialProfile(input: {
  displayName?: string;
  bio?: string;
  photoURL?: string | null;
}): Promise<PublicProfile> {
  return api
    .patch<{ profile: PublicProfile }>("/api/v1/social/profile", input)
    .then((r) => r.profile);
}

/** Any user's public profile by uid, with the caller's relationship to them. */
export function getPublicProfile(
  uid: string,
): Promise<{ profile: PublicProfile; relationship: Relationship }> {
  return api.get<{ profile: PublicProfile; relationship: Relationship }>(
    `/api/v1/social/users/${uid}`,
  );
}
