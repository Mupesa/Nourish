/**
 * Public profile (friend_activity_detail mockup, minus nudge/message which land
 * in Phase 4): avatar, handle, bio, counts, a relationship-aware action, a
 * block/unblock control, and the user's "Recent Creations" posts grid.
 */
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../api/client";
import { listUserPosts } from "../api/feed";
import {
  acceptRequest,
  blockUser,
  cancelRequest,
  sendFriendRequest,
  unblockUser,
  unfriend,
} from "../api/friends";
import { getPublicProfile } from "../api/social";
import { AppText } from "../components/AppText";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { colors, radius, spacing } from "../theme/tokens";
import { MainStackParamList } from "../navigation/types";
import { FeedPost, PublicProfile, Relationship } from "../types/domain";
import { liveStreak } from "../utils/streak";

type Props = NativeStackScreenProps<MainStackParamList, "UserProfile">;

export function UserProfileScreen({ route, navigation }: Props) {
  const { uid } = route.params;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [relationship, setRelationship] = useState<Relationship>("none");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [{ profile: p, relationship: rel }, ps] = await Promise.all([
        getPublicProfile(uid),
        listUserPosts(uid),
      ]);
      setProfile(p);
      setRelationship(rel);
      setPosts(ps);
    } catch (e) {
      console.warn("[userprofile] load failed", e);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof ApiError ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const confirmUnfriend = () =>
    Alert.alert("Remove friend", "Unfriend this person?", [
      { text: "Cancel", style: "cancel" },
      { text: "Unfriend", style: "destructive", onPress: () => void act(() => unfriend(uid)) },
    ]);

  const confirmBlock = () =>
    Alert.alert("Block user", "They won't see you or your posts.", [
      { text: "Cancel", style: "cancel" },
      { text: "Block", style: "destructive", onPress: () => void act(() => blockUser(uid)) },
    ]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const name = profile?.handle
    ? `@${profile.handle}`
    : profile?.displayName ?? "Nourish user";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </Pressable>
        {relationship !== "self" && relationship !== "blocked" && (
          <Pressable onPress={confirmBlock} style={styles.iconBtn}>
            <MaterialIcons name="block" size={22} color={colors.outline} />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHead}>
          <Avatar uri={profile?.photoURL ?? null} label={name} size={96} />
          <AppText variant="headline">{name}</AppText>
          {profile?.bio ? (
            <AppText variant="body" color={colors.onSurfaceVariant} center>
              {profile.bio}
            </AppText>
          ) : null}
          <View style={styles.stats}>
            <Stat value={profile?.friendCount ?? 0} label="Friends" />
            <Stat value={profile?.postCount ?? 0} label="Posts" />
            <Stat value={liveStreak(profile?.streak)} label="Day streak" />
          </View>
        </View>

        {/* Relationship action */}
        {relationship === "none" && (
          <Button label="Add friend" loading={busy} onPress={() => void act(() => sendFriendRequest(uid))} />
        )}
        {relationship === "incoming_pending" && (
          <Button label="Accept request" loading={busy} onPress={() => void act(() => acceptRequest(uid))} />
        )}
        {relationship === "outgoing_pending" && (
          <Button label="Cancel request" variant="secondary" loading={busy} onPress={() => void act(() => cancelRequest(uid))} />
        )}
        {relationship === "friends" && (
          <Button label="Friends ✓ — Unfriend" variant="secondary" loading={busy} onPress={confirmUnfriend} />
        )}
        {relationship === "blocked" && (
          <Button label="Unblock" variant="secondary" loading={busy} onPress={() => void act(() => unblockUser(uid))} />
        )}

        {/* Posts grid */}
        <AppText variant="label" color={colors.outline}>
          Recent Creations
        </AppText>
        {posts.length === 0 ? (
          <AppText variant="body" color={colors.onSurfaceVariant}>
            No posts yet.
          </AppText>
        ) : (
          <View style={styles.grid}>
            {posts.map((p) => (
              <View key={p.id} style={styles.tile}>
                <Image source={{ uri: p.imageUrl }} style={styles.tileImg} />
                {p.kcal != null && (
                  <View style={styles.tileBadge}>
                    <AppText variant="label" color={colors.onSurface}>
                      {p.kcal}
                    </AppText>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="headline">{value}</AppText>
      <AppText variant="label" color={colors.outline}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.sm,
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 100 },
  profileHead: { alignItems: "center", gap: spacing.sm },
  stats: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.xs },
  stat: { alignItems: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  tile: {
    width: "32%",
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainer,
  },
  tileImg: { width: "100%", height: "100%" },
  tileBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: colors.tertiaryFixed,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
});
