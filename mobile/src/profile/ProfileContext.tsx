/**
 * Loads and caches the user's profile once authenticated. The presence and
 * `onboardingCompleted` flag of this profile is what RootNavigator uses to
 * decide between the onboarding flow and the main app.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ApiError } from "../api/client";
import { fetchProfile } from "../api/profile";
import { useAuth } from "../auth/AuthContext";
import { UserProfile } from "../types/domain";

interface ProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  /** Convenience: whether the current user has premium. */
  isPremium: boolean;
  /**
   * Remaining free recipe-detail views, or null until first observed. The
   * backend returns this on each recipe-detail response; screens call
   * noteFreeViewsRemaining to keep it fresh so counters/paywalls stay accurate.
   */
  freeViewsRemaining: number | null;
  noteFreeViewsRemaining: (n: number) => void;
  /** Re-fetch from the backend (after onboarding or edits). */
  refresh: () => Promise<void>;
  /** Optimistically set the profile (e.g. from an onboarding response). */
  setProfile: (p: UserProfile) => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuth();
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [freeViewsRemaining, setFreeViews] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { profile: p } = await fetchProfile();
      setProfileState(p);
    } catch (e) {
      // 404 = not onboarded yet; that's expected, not an error.
      if (e instanceof ApiError && e.status === 404) {
        setProfileState(null);
      } else {
        console.warn("[profile] load failed", e);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (initializing) return;
    if (user) {
      void refresh();
    } else {
      setProfileState(null);
      setFreeViews(null);
      setLoading(false);
    }
  }, [user, initializing, refresh]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        isPremium: profile?.isPremium === true,
        freeViewsRemaining,
        noteFreeViewsRemaining: setFreeViews,
        refresh,
        setProfile: setProfileState,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
