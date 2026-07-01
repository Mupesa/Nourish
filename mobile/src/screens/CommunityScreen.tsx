/**
 * Community tab (community_hub mockup, minus ephemeral snaps): friends-only
 * "Cooked Today" feed, a friends rail, a header avatar → Profile and a people
 * icon → Friends, and a + FAB → share a meal.
 */
import { MaterialIcons } from "@expo/vector-icons";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../api/client";
import { deletePost, likePost, listFeed, reportPost, unlikePost } from "../api/feed";
import { blockUser, listFriends } from "../api/friends";
import { getMyProfile } from "../api/social";
import { AppText } from "../components/AppText";
import { Avatar } from "../components/Avatar";
import { InlineError } from "../components/InlineError";
import { PostCard } from "../components/PostCard";
import { useAuth } from "../auth/AuthContext";
import { colors, radius, spacing } from "../theme/tokens";
import { MainStackParamList, MainTabParamList } from "../navigation/types";
import { FeedPost, Friend, PublicProfile } from "../types/domain";
import { liveStreak } from "../utils/streak";

type Props = BottomTabScreenProps<MainTabParamList, "Community">;

export function CommunityScreen({ navigation }: Props) {
  const { user } = useAuth();
  const parent =
    navigation.getParent<NativeStackNavigationProp<MainStackParamList>>();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [me, setMe] = useState<PublicProfile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [feed, profile, fr] = await Promise.all([
        listFeed(),
        getMyProfile(),
        listFriends(),
      ]);
      setPosts(feed);
      setMe(profile);
      setFriends(fr);
    } catch (e) {
      console.warn("[community] load failed", e);
      setError("Couldn't load your feed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onToggleLike = (post: FeedPost) => {
    const wasLiked = post.likedByMe;
    // Optimistic update.
    setPosts((ps) =>
      ps.map((p) =>
        p.id === post.id
          ? {
              ...p,
              likedByMe: !wasLiked,
              likeCount: p.likeCount + (wasLiked ? -1 : 1),
            }
          : p,
      ),
    );
    const call = wasLiked ? unlikePost(post.id) : likePost(post.id);
    call
      .then((res) =>
        setPosts((ps) =>
          ps.map((p) =>
            p.id === post.id
              ? { ...p, likedByMe: res.likedByMe, likeCount: res.likeCount }
              : p,
          ),
        ),
      )
      .catch(() =>
        // Roll back on failure.
        setPosts((ps) =>
          ps.map((p) =>
            p.id === post.id
              ? { ...p, likedByMe: wasLiked, likeCount: post.likeCount }
              : p,
          ),
        ),
      );
  };

  const onMore = (post: FeedPost) =>
    Alert.alert("Post options", post.authorHandle ? `@${post.authorHandle}` : "This post", [
      {
        text: "Report post",
        onPress: async () => {
          try {
            await reportPost(post.id, "inappropriate");
            Alert.alert("Reported", "Thanks — our team will review this.");
          } catch (e) {
            Alert.alert("Error", e instanceof ApiError ? e.message : "Failed");
          }
        },
      },
      {
        text: "Block author",
        style: "destructive",
        onPress: async () => {
          try {
            await blockUser(post.authorUid);
            await load();
          } catch (e) {
            Alert.alert("Error", e instanceof ApiError ? e.message : "Failed");
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);

  const onDelete = (post: FeedPost) =>
    Alert.alert("Delete post", "Remove this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePost(post.id);
            setPosts((p) => p.filter((x) => x.id !== post.id));
          } catch (e) {
            Alert.alert("Error", e instanceof ApiError ? e.message : "Failed");
          }
        },
      },
    ]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <InlineError message={error} onRetry={() => void load()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="display" color={colors.primary}>
          Community
        </AppText>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => parent?.navigate("Friends")}
            style={styles.iconBtn}
          >
            <MaterialIcons name="group" size={24} color={colors.primary} />
          </Pressable>
          <Pressable onPress={() => parent?.navigate("Profile")}>
            <Avatar
              uri={me?.photoURL ?? null}
              label={me?.handle ?? me?.displayName ?? "Me"}
              size={36}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* My streak */}
        {me && liveStreak(me.streak) > 0 && (
          <View style={styles.streakChip}>
            <MaterialIcons
              name="local-fire-department"
              size={20}
              color={colors.secondary}
            />
            <AppText variant="bodySemiBold" color={colors.secondary}>
              {liveStreak(me.streak)}-day cooking streak
            </AppText>
          </View>
        )}

        {/* Friends rail */}
        {friends.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}
          >
            {friends.map((f) => (
              <Pressable
                key={f.uid}
                style={styles.railItem}
                onPress={() => parent?.navigate("UserProfile", { uid: f.uid })}
              >
                <Avatar
                  uri={f.photoURL}
                  label={f.handle ?? f.displayName ?? "?"}
                  size={56}
                />
                <AppText variant="label" color={colors.onSurfaceVariant} numberOfLines={1}>
                  {f.handle ?? f.displayName ?? "friend"}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <AppText variant="label" color={colors.outline}>
          Cooked Today
        </AppText>

        {posts.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="restaurant" size={40} color={colors.outline} />
            <AppText variant="body" color={colors.onSurfaceVariant} center>
              No posts yet. Tap + to share a meal, or add friends to see theirs.
            </AppText>
          </View>
        ) : (
          posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              currentUid={user?.uid}
              onPressAuthor={() =>
                parent?.navigate("UserProfile", { uid: p.authorUid })
              }
              onToggleLike={() => onToggleLike(p)}
              onDelete={() => onDelete(p)}
              onMore={() => onMore(p)}
            />
          ))
        )}
      </ScrollView>

      {/* Share FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => parent?.navigate("CreatePost")}
        accessibilityLabel="Share a meal"
      >
        <MaterialIcons name="add-a-photo" size={26} color={colors.onPrimary} />
      </Pressable>
    </SafeAreaView>
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
    paddingTop: spacing.sm,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconBtn: { padding: 4 },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 120 },
  streakChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rail: { gap: spacing.md, paddingRight: spacing.gutter },
  railItem: { alignItems: "center", gap: 4, width: 64 },
  empty: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.lg },
  fab: {
    position: "absolute",
    right: spacing.gutter,
    bottom: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});
