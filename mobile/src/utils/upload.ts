/**
 * Meal-photo upload. Compresses a locally-picked/captured image and uploads it
 * to Firebase Storage under posts/{uid}/, returning the public download URL and
 * the storage path (the backend needs the path to delete the object later).
 */
import * as ImageManipulator from "expo-image-manipulator";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, storage } from "../config/firebase";

export interface UploadedImage {
  url: string;
  path: string;
}

/** Resize to a sensible max width + JPEG-compress before upload. */
async function compress(localUri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 1080 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

export async function uploadMealImage(localUri: string): Promise<UploadedImage> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const compressedUri = await compress(localUri);

  // React Native: fetch the local file into a Blob for uploadBytes.
  const response = await fetch(compressedUri);
  const blob = await response.blob();

  const rand = Math.random().toString(36).slice(2, 10);
  const path = `posts/${user.uid}/${Date.now()}-${rand}.jpg`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  const url = await getDownloadURL(storageRef);

  return { url, path };
}
