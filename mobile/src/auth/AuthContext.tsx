/**
 * Auth provider. Implements the "value-first" deferred-registration flow:
 *
 *  - On first launch the app shows a welcome/sign-in screen (needsAuthDecision).
 *  - "Get started" calls continueAsGuest() which signs in anonymously so the
 *    user can complete onboarding and their data is written under a real uid.
 *  - "I have an account" routes to the SignIn screen.
 *  - At the end of onboarding, registerWithEmail() LINKs an email/password
 *    credential to the existing anonymous account, preserving all data (same uid).
 */
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  User,
} from "firebase/auth";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth } from "../config/firebase";

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  isAnonymous: boolean;
  /**
   * True when there is no active session and the app is waiting for the user
   * to choose between "Get started" (guest) or "Sign in" (existing account).
   */
  needsAuthDecision: boolean;
  /** Sign in anonymously so the user can explore and onboard before registering. */
  continueAsGuest: () => Promise<void>;
  /** Link email/password to the current (anonymous) account, or create a new one. */
  registerWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [needsAuthDecision, setNeedsAuthDecision] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (next) => {
      if (!next) {
        // No active session — surface the welcome/sign-in screen rather than
        // silently creating an anonymous session. The user picks their path.
        setNeedsAuthDecision(true);
        setUser(null);
        setInitializing(false);
        return;
      }
      setNeedsAuthDecision(false);
      setUser(next);
      setInitializing(false);
    });
    return unsub;
  }, []);

  const continueAsGuest = async () => {
    await signInAnonymously(auth);
    // onAuthStateChanged fires with the anon user → needsAuthDecision clears automatically
  };

  const registerWithEmail = async (email: string, password: string) => {
    const current = auth.currentUser;
    if (current?.isAnonymous) {
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(current, credential);
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    await fbSignOut(auth);
    // onAuthStateChanged fires with null → needsAuthDecision becomes true
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      isAnonymous: user?.isAnonymous ?? false,
      needsAuthDecision,
      continueAsGuest,
      registerWithEmail,
      signInWithEmail,
      sendPasswordReset,
      signOut,
    }),
    [user, initializing, needsAuthDecision],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
