/**
 * Password-reset screen. Sends a Firebase reset email and shows inline
 * success/error feedback so the user never has to leave the form.
 */
import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../AuthContext";
import { authErrorMessage } from "../firebaseErrors";
import { AppText } from "../../components/AppText";
import { Button } from "../../components/Button";
import { TextField } from "../../components/TextField";
import { colors, spacing } from "../../theme/tokens";
import { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function ForgotPasswordScreen({ navigation, route }: Props) {
  const { sendPasswordReset } = useAuth();

  const [email, setEmail] = useState(route.params?.prefillEmail ?? "");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");

  const validateEmail = () => {
    if (!email.trim()) { setEmailError("Email is required."); return false; }
    if (!isValidEmail(email)) { setEmailError("Enter a valid email address."); return false; }
    setEmailError("");
    return true;
  };

  const handleSend = async () => {
    if (!validateEmail()) return;
    Keyboard.dismiss();
    setFormError("");
    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (e) {
      setFormError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={styles.backBtn}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </Pressable>
          <AppText variant="display" color={colors.primary}>Nourish</AppText>
          <View style={styles.backBtn} />
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <AppText variant="headline">Reset your password</AppText>
          <AppText variant="body" color={colors.onSurfaceVariant}>
            Enter your email and we'll send you a link to create a new password.
          </AppText>
        </View>

        {sent ? (
          /* Success state */
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <MaterialIcons name="mark-email-read" size={32} color={colors.primary} />
            </View>
            <AppText variant="bodySemiBold" center>Check your inbox</AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} center>
              We sent a reset link to {"\n"}
              <AppText variant="bodySemiBold" color={colors.onSurface}>{email.trim()}</AppText>
            </AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} center>
              Check your spam folder if it doesn't arrive within a minute.
            </AppText>
            <Button
              label="Back to sign in"
              variant="secondary"
              onPress={() => navigation.navigate("SignIn")}
            />
          </View>
        ) : (
          /* Form state */
          <View style={styles.form}>
            <TextField
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="send"
              value={email}
              onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(""); }}
              onBlur={validateEmail}
              onSubmitEditing={handleSend}
              placeholder="you@example.com"
              error={emailError}
              autoComplete="email"
            />

            {formError ? (
              <View style={styles.formError}>
                <MaterialIcons name="error-outline" size={16} color={colors.error} />
                <AppText variant="body" color={colors.error} style={styles.formErrorText}>
                  {formError}
                </AppText>
              </View>
            ) : null}

            <Button label="Send reset link" onPress={handleSend} loading={loading} />

            <Button
              label="Back to sign in"
              variant="ghost"
              onPress={() => navigation.navigate("SignIn")}
              disabled={loading}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.gutter,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
  },
  backBtn: { width: 32, height: 32, justifyContent: "center" },
  titleBlock: { gap: spacing.base },
  form: { gap: spacing.sm },
  formError: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.errorContainer,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.base,
  },
  formErrorText: { flex: 1 },
  successCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
});
