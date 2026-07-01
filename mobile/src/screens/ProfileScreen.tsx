/**
 * Profile (own): account status, computed targets, your @handle + posts grid,
 * and entry points to Friends / share a meal / sign out. Reached from the
 * Community header avatar (Phase 3 nav swap moved Profile off the tab bar).
 */
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { listUserPosts } from "../api/feed";
import { getMyProfile } from "../api/social";
import { AppText } from "../components/AppText";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { useAuth } from "../auth/AuthContext";
import { useProfile } from "../profile/ProfileContext";
import { MainStackParamList } from "../navigation/types";
import { FeedPost, PublicProfile } from "../types/domain";
import { colors, radius, spacing } from "../theme/tokens";
import { liveStreak } from "../utils/streak";

export function ProfileScreen() {
  const { user, isAnonymous, signOut } = useAuth();
  const { profile } = useProfile();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const [social, setSocial] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [me, mine] = await Promise.all([
        getMyProfile(),
        listUserPosts(user.uid),
      ]);
      setSocial(me);
      setPosts(mine);
    } catch (e) {
      console.warn("[profile] load failed", e);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const name = social?.handle
    ? `@${social.handle}`
    : social?.displayName ?? "Nourish user";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </Pressable>
        <AppText variant="headline">Profile</AppText>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          <Avatar uri={social?.photoURL ?? null} label={name} size={72} />
          <AppText variant="headline">{name}</AppText>
          {liveStreak(social?.streak) > 0 && (
            <AppText variant="bodySemiBold" color={colors.secondary}>
              🔥 {liveStreak(social?.streak)}-day cooking streak
            </AppText>
          )}
          {social?.bio ? (
            <AppText variant="body" color={colors.onSurfaceVariant} center>
              {social.bio}
            </AppText>
          ) : null}
        </View>

        <View style={styles.card}>
          <AppText variant="label" color={colors.outline}>
            Account
          </AppText>
          <AppText variant="bodySemiBold">
            {isAnonymous ? "Guest (not saved)" : user?.email ?? "Signed in"}
          </AppText>
          {profile?.isPremium ? (
            <View style={styles.premiumRow}>
              <MaterialIcons
                name="workspace-premium"
                size={18}
                color={colors.primary}
              />
              <AppText variant="bodySemiBold" color={colors.primary}>
                Premium member
              </AppText>
            </View>
          ) : (
            <Button
              label="Upgrade to Premium"
              variant="secondary"
              onPress={() =>
                Alert.alert(
                  "Coming soon",
                  "In-app purchases arrive in the next update. Hang tight!",
                )
              }
            />
          )}
        </View>

        {profile && (
          <View style={styles.card}>
            <AppText variant="label" color={colors.outline}>
              Your targets
            </AppText>
            <Row label="Daily goal" value={`${profile.targets.dailyGoalKcal} kcal`} />
            <Row label="BMR" value={`${profile.targets.bmrKcal} kcal`} />
            <Row label="TDEE" value={`${profile.targets.tdeeKcal} kcal`} />
            <Row label="Protein" value={`${profile.targets.macroTargets.proteinG} g`} />
            <Row label="Carbs" value={`${profile.targets.macroTargets.carbsG} g`} />
            <Row label="Fat" value={`${profile.targets.macroTargets.fatG} g`} />
            <Row label="Water goal" value={`${(profile.targets.waterGoalMl / 1000).toFixed(2)} L`} />
          </View>
        )}

        <Button label="Friends" onPress={() => navigation.navigate("Friends")} />
        <Button
          label="Share a meal"
          variant="secondary"
          onPress={() => navigation.navigate("CreatePost")}
        />

        {/* My posts */}
        <AppText variant="label" color={colors.outline}>
          Your posts ({posts.length})
        </AppText>
        {posts.length === 0 ? (
          <AppText variant="body" color={colors.onSurfaceVariant}>
            Nothing shared yet.
          </AppText>
        ) : (
          <View style={styles.grid}>
            {posts.map((p) => (
              <View key={p.id} style={styles.tile}>
                <Image source={{ uri: p.imageUrl }} style={styles.tileImg} />
              </View>
            ))}
          </View>
        )}

        <Button label="Sign out" variant="secondary" onPress={() => void signOut()} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="body" color={colors.onSurfaceVariant}>
        {label}
      </AppText>
      <AppText variant="bodySemiBold">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.sm,
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 60 },
  identity: { alignItems: "center", gap: spacing.xs },
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.base,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  premiumRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  tile: {
    width: "32%",
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainer,
  },
  tileImg: { width: "100%", height: "100%" },
});
