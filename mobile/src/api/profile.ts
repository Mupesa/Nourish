import { api } from "./client";
import { OnboardingPayload, UserProfile } from "../types/domain";

/** Complete onboarding — creates the profile and computes nutrition targets. */
export function submitOnboarding(payload: OnboardingPayload) {
  return api.post<{ profile: UserProfile }>("/api/v1/profile/onboarding", payload);
}

/** Fetch the current user's profile (404 if not onboarded yet). */
export function fetchProfile() {
  return api.get<{ profile: UserProfile }>("/api/v1/profile");
}

/** Partial update; backend recomputes targets when inputs change. */
export function updateProfile(patch: Partial<OnboardingPayload> & { displayName?: string }) {
  return api.patch<{ profile: UserProfile }>("/api/v1/profile", patch);
}
