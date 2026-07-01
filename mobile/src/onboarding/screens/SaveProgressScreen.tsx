/**
 * Final onboarding step. The user can create an account (email/password, linked
 * to their anonymous session so data is preserved) or skip and go straight to
 * the app. Either path submits onboarding, which creates the profile and
 * computes their targets — after which RootNavigator swaps to the main app.
 */
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ApiError } from "../../api/client";
import { authErrorMessage } from "../../auth/firebaseErrors";
import { AppText } from "../../components/AppText";
import { Button } from "../../components/Button";
import { OnboardingLayout } from "../../components/OnboardingLayout";
import { TextField } from "../../components/TextField";
import { useAuth } from "../../auth/AuthContext";
import { useProfile } from "../../profile/ProfileContext";
import { colors, spacing } from "../../theme/tokens";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding } from "../OnboardingContext";
import { ONBOARDING_STEPS } from "../labels";

type Props = NativeStackScreenProps<OnboardingStackParamList, "SaveProgress">;

const MIN_PASSWORD_LENGTH = 8;

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function SaveProgressScreen({ navigation }: Props) {
  const { submit, isComplete } = useOnboarding();
  const { registerWithEmail } = useAuth();
  const { refresh } = useProfile();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) { setEmailError("Email is required."); return false; }
    if (!isValidEmail(email)) { setEmailError("Enter a valid email address."); return false; }
    setEmailError(""); return true;
  };

  const validatePassword = () => {
    if (!password) { setPasswordError("Password is required."); return false; }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`); return false;
    }
    setPasswordError(""); return true;
  };

  const validateConfirm = () => {
    if (confirmPassword !== password) {
      setConfirmError("Passwords don't match."); return false;
    }
    setConfirmError(""); return true;
  };

  const finish = async (withAccount: boolean) => {
    if (!isComplete) {
      setFormError("Please complete the earlier steps first.");
      return;
    }
    if (withAccount) {
      const emailOk = validateEmail();
      const pwOk = validatePassword();
      const confirmOk = validateConfirm();
      if (!emailOk || !pwOk || !confirmOk) return;
    }
    setBusy(true);
    setFormError("");
    try {
      if (withAccount) {
        await registerWithEmail(email.trim(), password);
      }
      await submit();
      await refresh(); // loads new profile → navigation switches to Main
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : authErrorMessage(e);
      setFormError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingLayout
      step={4}
      totalSteps={ONBOARDING_STEPS}
      title="Want to save your progress?"
      subtitle="Create an account to sync across devices and unlock social features. Totally optional."
      onBack={() => navigation.goBack()}
    >
      <View style={styles.form}>
        <TextField
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
          value={email}
          onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(""); }}
          onBlur={validateEmail}
          placeholder="you@example.com"
          error={emailError}
          autoComplete="new-password"
        />
        <TextField
          label="Password"
          secure
          returnKeyType="next"
          value={password}
          onChangeText={(v) => { setPassword(v); if (passwordError) setPasswordError(""); }}
          onBlur={validatePassword}
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          error={passwordError}
          autoComplete="new-password"
        />
        <TextField
          label="Confirm password"
          secure
          returnKeyType="done"
          value={confirmPassword}
          onChangeText={(v) => { setConfirmPassword(v); if (confirmError) setConfirmError(""); }}
          onBlur={validateConfirm}
          placeholder="Repeat your password"
          error={confirmError}
          autoComplete="new-password"
        />

        {formError ? (
          <AppText variant="body" color={colors.error}>{formError}</AppText>
        ) : null}

        <Button
          label="Create account & finish"
          onPress={() => finish(true)}
          loading={busy}
        />

        <View style={styles.divider}>
          <View style={styles.line} />
          <AppText variant="label" color={colors.outline}>or</AppText>
          <View style={styles.line} />
        </View>

        <Button
          label="Skip for now, go to dashboard"
          variant="secondary"
          onPress={() => finish(false)}
          disabled={busy}
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.sm },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  line: { flex: 1, height: 1, backgroundColor: colors.outlineVariant },
});
