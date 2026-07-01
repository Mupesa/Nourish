/**
 * Labelled text input matching DESIGN.md (56px height, cream fill, sage focus).
 * Pass `secure` to get an inline show/hide eye toggle instead of bare secureTextEntry.
 */
import { MaterialIcons } from "@expo/vector-icons";
import React, { forwardRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { AppText } from "./AppText";

interface Props extends TextInputProps {
  label?: string;
  suffix?: string;
  error?: string;
  /** Adds a show/hide toggle; replaces bare secureTextEntry for password fields. */
  secure?: boolean;
}

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, suffix, error, secure, style, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      {label && (
        <AppText variant="label" color={colors.onSurfaceVariant}>
          {label}
        </AppText>
      )}
      <View
        style={[
          styles.field,
          focused && styles.focused,
          !!error && styles.errored,
        ]}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={colors.outline}
          style={[styles.input, style]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secure && !visible}
          {...rest}
        />
        {secure && (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            accessibilityLabel={visible ? "Hide password" : "Show password"}
          >
            <MaterialIcons
              name={visible ? "visibility" : "visibility-off"}
              size={20}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
        )}
        {suffix && !secure && (
          <AppText variant="body" color={colors.onSurfaceVariant}>
            {suffix}
          </AppText>
        )}
      </View>
      {error && (
        <AppText variant="body" color={colors.error}>
          {error}
        </AppText>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, flex: 1 },
  field: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.default,
  },
  focused: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surfaceContainerLowest,
  },
  errored: { borderColor: colors.error },
  input: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 16,
    color: colors.onSurface,
    padding: 0,
  },
});
