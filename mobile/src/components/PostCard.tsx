/**
 * Community feed post (community_hub mockup): author row, meal photo with kcal
 * badge, caption, and a like count. Likes become interactive in stage 3.3.
 */
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { FeedPost } from "../types/domain";
import { AppText } from "./AppText";
import { Avatar } from "./Avatar";

function timeAgo(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  post: FeedPost;
  currentUid?: string;
  onPressAuthor?: () => void;
  onToggleLike?: () => void;
  onDelete?: () => void;
  onMore?: () => void;
}

export function PostCard({
  post,
  currentUid,
  onPressAuthor,
  onToggleLike,
  onDelete,
  onMore,
}: Props) {
  const name = post.authorHandle
    ? `@${post.authorHandle}`
    : post.authorName ?? "Nourish user";
  const mine = currentUid != null && currentUid === post.authorUid;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Pressable style={styles.author} onPress={onPressAuthor}>
          <Avatar uri={post.authorPhoto} label={name} size={40} />
          <View>
            <AppText variant="bodySemiBold" numberOfLines={1}>
              {name}
            </AppText>
            <AppText variant="label" color={colors.outline}>
              {timeAgo(post.createdAt)}
            </AppText>
          </View>
        </Pressable>
        {mine && onDelete ? (
          <Pressable onPress={onDelete} style={styles.iconBtn} hitSlop={8}>
            <MaterialIcons name="delete-outline" size={22} color={colors.outline} />
          </Pressable>
        ) : !mine && onMore ? (
          <Pressable onPress={onMore} style={styles.iconBtn} hitSlop={8}>
            <MaterialIcons name="more-vert" size={22} color={colors.outline} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.imageWrap}>
        <Image source={{ uri: post.imageUrl }} style={styles.image} />
        {post.kcal != null && (
          <View style={styles.badge}>
            <AppText variant="label" color={colors.onSurface}>
              {post.kcal} kcal
            </AppText>
          </View>
        )}
      </View>

      {post.caption ? (
        <AppText variant="body" style={styles.caption}>
          {post.caption}
        </AppText>
      ) : null}

      <Pressable
        style={styles.likeRow}
        onPress={onToggleLike}
        hitSlop={8}
        disabled={!onToggleLike}
      >
        <MaterialIcons
          name={post.likedByMe ? "favorite" : "favorite-border"}
          size={20}
          color={post.likedByMe ? colors.secondary : colors.outline}
        />
        <AppText
          variant="label"
          color={post.likedByMe ? colors.secondary : colors.outline}
        >
          {post.likeCount}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.sm,
  },
  author: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  iconBtn: { padding: 4 },
  imageWrap: { position: "relative", backgroundColor: colors.surfaceContainer },
  image: { width: "100%", aspectRatio: 4 / 3 },
  badge: {
    position: "absolute",
    top: spacing.base,
    right: spacing.base,
    backgroundColor: colors.tertiaryFixed,
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: 2,
  },
  caption: { paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  likeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: spacing.sm,
  },
});
