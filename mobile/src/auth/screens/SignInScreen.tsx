/**
 * Email/password sign-in for returning users. Validates inline, maps Firebase
 * error codes to friendly messages, and links to forgot-password flow.
 */
import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
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

type Props = NativeStackScreenProps<AuthStackParamList, "SignIn">;

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function SignInScreen({ navigation }: Props) {
  const { signInWithEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const validateEmail = () => {
    if (!email.trim()) { setEmailError("Email is required."); return false; }
    if (!isValidEmail(email)) { setEmailError("Enter a valid email address."); return false; }
    setEmailError("");
    return true;
  };

  const validatePassword = () => {
    if (!password) { setPasswordError("Password is required."); return false; }
    setPasswordError("");
    return true;
  };

  const handleSignIn = async () => {
    const emailOk = validateEmail();
    const passwordOk = validatePassword();
    if (!emailOk || !passwordOk) return;

    Keyboard.dismiss();
    setFormError("");
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      // onAuthStateChanged fires → needsAuthDecision clears → RootNavigator to Main
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
          <AppText variant="headline">Welcome back</AppText>
          <AppText variant="body" color={colors.onSurfaceVariant}>
            Sign in to pick up where you left off.
          </AppText>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextField
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            value={email}
            onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(""); }}
            onBlur={validateEmail}
            onSubmitEditing={() => passwordRef.current?.focus()}
            placeholder="you@example.com"
            error={emailError}
            autoComplete="email"
          />
          <TextField
            ref={passwordRef}
            label="Password"
            secure
            returnKeyType="done"
            value={password}
            onChangeText={(v) => { setPassword(v); if (passwordError) setPasswordError(""); }}
            onBlur={validatePassword}
            onSubmitEditing={handleSignIn}
            placeholder="Your password"
            error={passwordError}
            autoComplete="current-password"
          />

          {/* Forgot password */}
          <Pressable
            onPress={() => navigation.navigate("ForgotPassword", { prefillEmail: email.trim() })}
            style={styles.forgotBtn}
            hitSlop={8}
          >
            <AppText variant="bodySemiBold" color={colors.primary}>
              Forgot password?
            </AppText>
          </Pressable>

          {formError ? (
            <View style={styles.formError}>
              <MaterialIcons name="error-outline" size={16} color={colors.error} />
              <AppText variant="body" color={colors.error} style={styles.formErrorText}>
                {formError}
              </AppText>
            </View>
          ) : null}

          <Button label="Sign in" onPress={handleSignIn} loading={loading} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <AppText variant="body" color={colors.onSurfaceVariant}>New to Nourish?</AppText>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <AppText variant="bodySemiBold" color={colors.primary}> Get started free</AppText>
          </Pressable>
        </View>
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
  forgotBtn: { alignSelf: "flex-end" },
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: "auto",
    paddingTop: spacing.md,
  },
});
