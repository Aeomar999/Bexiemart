import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";

type PickerOptions = {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  allowsMultipleSelection?: boolean;
};

export function useImagePicker(options: PickerOptions = {}) {
  const [image, setImage] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera roll permission is required to select photos.");
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return null;

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [4, 3],
        quality: options.quality ?? 0.8,
        allowsMultipleSelection: options.allowsMultipleSelection ?? false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          name: asset.fileName ?? `photo_${Date.now()}.jpg`,
          type: asset.mimeType ?? "image/jpeg",
        };

        if (options.allowsMultipleSelection && result.assets.length > 1) {
          const uris = result.assets.map((a) => a.uri);
          setImages(uris);
          return result.assets.map((a) => ({
            uri: a.uri,
            name: a.fileName ?? `photo_${Date.now()}.jpg`,
            type: a.mimeType ?? "image/jpeg",
          }));
        }

        setImage(asset.uri);
        return file;
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera permission is required to take photos.");
        return null;
      }
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [4, 3],
        quality: options.quality ?? 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          name: asset.fileName ?? `photo_${Date.now()}.jpg`,
          type: asset.mimeType ?? "image/jpeg",
        };
        setImage(asset.uri);
        return file;
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { image, images, loading, pickImage, takePhoto };
}
