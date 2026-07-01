/**
 * Create a meal post (snap_share / snap_preview mockups, AI deferred): pick a
 * photo (camera or library), add a manual calorie tag + caption, upload to
 * Storage and post to the feed.
 */
import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../api/client";
import { createPost } from "../api/feed";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { colors, radius, spacing } from "../theme/tokens";
import { MainStackParamList } from "../navigation/types";
import { uploadMealImage } from "../utils/upload";

type Props = NativeStackScreenProps<MainStackParamList, "CreatePost">;

export function CreatePostScreen({ navigation }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [kcal, setKcal] = useState("");
  const [posting, setPosting] = useState(false);

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to choose a meal photo.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!res.canceled && res.assets[0]) setImageUri(res.assets[0].uri);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow camera access to snap your meal.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!res.canceled && res.assets[0]) setImageUri(res.assets[0].uri);
  };

  const submit = async () => {
    if (!imageUri) {
      Alert.alert("Add a photo", "Pick or take a meal photo first.");
      return;
    }
    setPosting(true);
    try {
      const { url, path } = await uploadMealImage(imageUri);
      const parsedKcal = kcal.trim() ? parseInt(kcal.trim(), 10) : NaN;
      await createPost({
        imageUrl: url,
        imagePath: path,
        caption: caption.trim(),
        kcal: Number.isFinite(parsedKcal) ? parsedKcal : null,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e instanceof ApiError ? e.message : "Could not post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <MaterialIcons name="close" size={24} color={colors.onSurface} />
        </Pressable>
        <AppText variant="headline">Share a meal</AppText>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {imageUri ? (
          <Pressable onPress={pickFromLibrary}>
            <Image source={{ uri: imageUri }} style={styles.preview} />
          </Pressable>
        ) : (
          <View style={styles.pickRow}>
            <Pressable style={styles.pickBtn} onPress={takePhoto}>
              <MaterialIcons name="photo-camera" size={28} color={colors.primary} />
              <AppText variant="bodySemiBold" color={colors.primary}>
                Camera
              </AppText>
            </Pressable>
            <Pressable style={styles.pickBtn} onPress={pickFromLibrary}>
              <MaterialIcons name="photo-library" size={28} color={colors.primary} />
              <AppText variant="bodySemiBold" color={colors.primary}>
                Library
              </AppText>
            </Pressable>
          </View>
        )}

        <TextField
          label="Caption"
          placeholder="What did you cook?"
          value={caption}
          onChangeText={setCaption}
          multiline
        />

        <TextField
          label="Calories (optional)"
          placeholder="e.g. 420"
          keyboardType="number-pad"
          value={kcal}
          onChangeText={setKcal}
          suffix="kcal"
        />

        <Button
          label="Post to feed"
          onPress={() => void submit()}
          loading={posting}
          disabled={!imageUri}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.sm,
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 60 },
  preview: { width: "100%", aspectRatio: 4 / 3, borderRadius: radius.lg },
  pickRow: { flexDirection: "row", gap: spacing.md },
  pickBtn: {
    flex: 1,
    height: 120,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.surfaceContainerLowest,
  },
});
