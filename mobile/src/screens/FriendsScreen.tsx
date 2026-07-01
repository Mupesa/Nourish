/**
 * Friends (Phase 3.1): set your @handle, search people, manage incoming/outgoing
 * requests, and view your friends. Tapping a result/friend acts inline.
 */
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
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
import {
  acceptRequest,
  blockUser,
  cancelRequest,
  declineRequest,
  listFriends,
  listRequests,
  searchUsers,
  sendFriendRequest,
  unfriend,
} from "../api/friends";
import { claimHandle, getMyProfile } from "../api/social";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { ApiError } from "../api/client";
import { colors, radius, spacing } from "../theme/tokens";
import { MainStackParamList } from "../navigation/types";
import {
  Friend,
  FriendRequestCard,
  PublicProfile,
  SearchResult,
} from "../types/domain";

type Props = NativeStackScreenProps<MainStackParamList, "Friends">;

function nameOf(p: {
  handle: string | null;
  displayName: string | null;
}): string {
  if (p.handle) return `@${p.handle}`;
  return p.displayName ?? "Nourish user";
}

function Avatar({
  uri,
  label,
  size = 44,
}: {
  uri: string | null;
  label: string;
  size?: number;
}) {
  const dim = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={dim} />;
  const letter = label.replace("@", "").charAt(0).toUpperCase() || "?";
  return (
    <View style={[styles.avatarFallback, dim]}>
      <AppText variant="bodySemiBold" color={colors.onPrimary}>
        {letter}
      </AppText>
    </View>
  );
}

export function FriendsScreen({ navigation }: Props) {
  const [me, setMe] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [handleInput, setHandleInput] = useState("");
  const [handleError, setHandleError] = useState<string | undefined>();
  const [savingHandle, setSavingHandle] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [incoming, setIncoming] = useState<FriendRequestCard[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequestCard[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);

  const loadLists = useCallback(async () => {
    const [profile, reqs, fr] = await Promise.all([
      getMyProfile(),
      listRequests(),
      listFriends(),
    ]);
    setMe(profile);
    setIncoming(reqs.incoming);
    setOutgoing(reqs.outgoing);
    setFriends(fr);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadLists()
        .catch((e) => console.warn("[friends] load failed", e))
        .finally(() => setLoading(false));
    }, [loadLists]),
  );

  // Debounced handle search.
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      searchUsers(q)
        .then(setResults)
        .catch((e) => console.warn("[friends] search failed", e))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const refresh = useCallback(async () => {
    await loadLists();
    const q = query.trim().toLowerCase();
    if (q.length >= 1) setResults(await searchUsers(q));
  }, [loadLists, query]);

  const onClaimHandle = async () => {
    setHandleError(undefined);
    setSavingHandle(true);
    try {
      const profile = await claimHandle(handleInput);
      setMe(profile);
      setHandleInput("");
    } catch (e) {
      setHandleError(
        e instanceof ApiError ? e.message : "Could not set handle",
      );
    } finally {
      setSavingHandle(false);
    }
  };

  const runAction = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      await refresh();
    } catch (e) {
      Alert.alert("Error", e instanceof ApiError ? e.message : "Action failed");
    }
  };

  const onAdd = (uid: string) =>
    runAction(async () => {
      const result = await sendFriendRequest(uid);
      if (result === "accepted") Alert.alert("Connected", "You're now friends!");
    });

  const confirmUnfriend = (f: Friend) =>
    Alert.alert("Remove friend", `Unfriend ${nameOf(f)}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unfriend",
        style: "destructive",
        onPress: () => void runAction(() => unfriend(f.uid)),
      },
    ]);

  const confirmBlock = (uid: string, label: string) =>
    Alert.alert("Block user", `Block ${label}? They won't see you or your posts.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: () => void runAction(() => blockUser(uid)),
      },
    ]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </Pressable>
        <AppText variant="headline">Friends</AppText>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Handle setup */}
        {me && !me.handle && (
          <View style={styles.card}>
            <AppText variant="bodySemiBold">Pick a @handle</AppText>
            <AppText variant="body" color={colors.onSurfaceVariant}>
              Friends find you by your handle. Letters, numbers and underscores.
            </AppText>
            <View style={styles.handleRow}>
              <TextField
                placeholder="yourhandle"
                autoCapitalize="none"
                autoCorrect={false}
                value={handleInput}
                onChangeText={setHandleInput}
                error={handleError}
              />
              <Button
                label="Save"
                onPress={() => void onClaimHandle()}
                loading={savingHandle}
                disabled={handleInput.trim().length < 3}
                style={styles.saveBtn}
              />
            </View>
          </View>
        )}
        {me?.handle && (
          <AppText variant="label" color={colors.outline}>
            You are @{me.handle}
          </AppText>
        )}

        {/* Search */}
        <View style={styles.section}>
          <TextField
            placeholder="Search by @handle"
            autoCapitalize="none"
            autoCorrect={false}
            value={query}
            onChangeText={setQuery}
          />
          {searching && <ActivityIndicator color={colors.primary} />}
          {!searching &&
            query.trim().length > 0 &&
            results.length === 0 && (
              <AppText variant="body" color={colors.onSurfaceVariant}>
                No one found for “{query.trim()}”.
              </AppText>
            )}
          {results.map((u) => (
            <PersonRow
              key={u.uid}
              uri={u.photoURL}
              title={nameOf(u)}
              subtitle={u.bio || undefined}
              onLongPress={() => confirmBlock(u.uid, nameOf(u))}
              right={
                u.relationship === "none" ? (
                  <ActionChip label="Add" primary onPress={() => onAdd(u.uid)} />
                ) : u.relationship === "incoming_pending" ? (
                  <ActionChip
                    label="Accept"
                    primary
                    onPress={() => void runAction(() => acceptRequest(u.uid))}
                  />
                ) : u.relationship === "outgoing_pending" ? (
                  <ActionChip
                    label="Cancel"
                    onPress={() => void runAction(() => cancelRequest(u.uid))}
                  />
                ) : u.relationship === "friends" ? (
                  <AppText variant="label" color={colors.primary}>
                    Friends
                  </AppText>
                ) : (
                  <AppText variant="label" color={colors.outline}>
                    Blocked
                  </AppText>
                )
              }
            />
          ))}
        </View>

        {/* Incoming requests */}
        {incoming.length > 0 && (
          <View style={styles.section}>
            <AppText variant="label" color={colors.outline}>
              Requests
            </AppText>
            {incoming.map((r) => (
              <PersonRow
                key={r.uid}
                uri={r.photoURL}
                title={nameOf(r)}
                right={
                  <View style={styles.actionsRow}>
                    <ActionChip
                      label="Accept"
                      primary
                      onPress={() => void runAction(() => acceptRequest(r.uid))}
                    />
                    <ActionChip
                      label="Decline"
                      onPress={() => void runAction(() => declineRequest(r.uid))}
                    />
                  </View>
                }
              />
            ))}
          </View>
        )}

        {/* Outgoing requests */}
        {outgoing.length > 0 && (
          <View style={styles.section}>
            <AppText variant="label" color={colors.outline}>
              Sent
            </AppText>
            {outgoing.map((r) => (
              <PersonRow
                key={r.uid}
                uri={r.photoURL}
                title={nameOf(r)}
                subtitle="Pending"
                right={
                  <ActionChip
                    label="Cancel"
                    onPress={() => void runAction(() => cancelRequest(r.uid))}
                  />
                }
              />
            ))}
          </View>
        )}

        {/* Friends */}
        <View style={styles.section}>
          <AppText variant="label" color={colors.outline}>
            Your friends ({friends.length})
          </AppText>
          {friends.length === 0 ? (
            <AppText variant="body" color={colors.onSurfaceVariant}>
              No friends yet. Search a handle above to connect.
            </AppText>
          ) : (
            friends.map((f) => (
              <PersonRow
                key={f.uid}
                uri={f.photoURL}
                title={nameOf(f)}
                onLongPress={() => confirmBlock(f.uid, nameOf(f))}
                right={
                  <ActionChip label="Unfriend" onPress={() => confirmUnfriend(f)} />
                }
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PersonRow({
  uri,
  title,
  subtitle,
  right,
  onLongPress,
}: {
  uri: string | null;
  title: string;
  subtitle?: string;
  right: React.ReactNode;
  onLongPress?: () => void;
}) {
  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={350}
      style={styles.personRow}
    >
      <Avatar uri={uri} label={title} />
      <View style={styles.personInfo}>
        <AppText variant="bodySemiBold" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="label" color={colors.outline} numberOfLines={1}>
            {subtitle}
          </AppText>
        )}
      </View>
      {right}
    </Pressable>
  );
}

function ActionChip({
  label,
  primary,
  onPress,
}: {
  label: string;
  primary?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        primary ? styles.chipPrimary : styles.chipOutline,
        pressed && styles.chipPressed,
      ]}
    >
      <AppText
        variant="label"
        color={primary ? colors.onPrimary : colors.primary}
      >
        {label}
      </AppText>
    </Pressable>
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
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  handleRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  saveBtn: { height: 56, paddingHorizontal: spacing.md },
  section: { gap: spacing.xs },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    gap: spacing.sm,
  },
  personInfo: { flex: 1, gap: 2 },
  avatarFallback: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionsRow: { flexDirection: "row", gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full ?? 999,
    alignItems: "center",
    justifyContent: "center",
  },
  chipPrimary: { backgroundColor: colors.primary },
  chipOutline: { borderWidth: 1, borderColor: colors.primary },
  chipPressed: { opacity: 0.8 },
});
