import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { Icon } from "@/components/ui/Icon";
import * as ImagePicker from "expo-image-picker";

export type PickerImage = {
  uri: string;
  type: string;
  name: string;
  url?: string;
};

interface PhotoPickerProps {
  images: PickerImage[];
  onChange: (images: PickerImage[]) => void;
  maxSelections?: number;
  allowsMultipleSelection?: boolean;
}

export function PhotoPicker({
  images,
  onChange,
  maxSelections = 5,
  allowsMultipleSelection = true,
}: PhotoPickerProps) {
  const pickImage = async () => {
    if (images.length >= maxSelections) {
      Alert.alert("Limit Reached", `You can only upload up to ${maxSelections} images.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection,
      selectionLimit: maxSelections - images.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: asset.fileName || `photo-${Date.now()}.jpg`,
      }));

      const combined = [...images, ...newImages].slice(0, maxSelections);
      onChange(combined);
    }
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <>
      {images.length > 0 ? (
        <View className="mb-8 flex-row flex-wrap gap-3">
          {images.map((img, idx) => (
            <View
              key={idx}
              className="w-[30%] relative rounded-xl overflow-hidden border border-border"
              style={{ aspectRatio: 1 }}
            >
              <Image
                source={{ uri: img.uri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
              <Pressable
                onPress={() => removeImage(idx)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full items-center justify-center"
              >
                <Icon name="x" size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
          {images.length < maxSelections && (
            <Pressable
              onPress={pickImage}
              className="w-[30%] bg-muted rounded-xl items-center justify-center border-2 border-dashed border-border"
              style={{ aspectRatio: 1 }}
            >
              <Icon name="plus" size={24} color="#64748b" />
            </Pressable>
          )}
        </View>
      ) : (
        <Pressable
          onPress={pickImage}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          className="w-full h-48 bg-muted rounded-2xl items-center justify-center border-2 border-dashed border-border mb-8"
        >
          <View className="w-14 h-14 bg-card rounded-full items-center justify-center mb-3">
            <Icon name="camera" size={24} color="#64748b" />
          </View>
          <Text className="text-body-md font-bold text-muted-foreground">Add Photos</Text>
          <Text className="text-body-sm text-muted-foreground mt-1">
            Upload up to {maxSelections} images
          </Text>
        </Pressable>
      )}
    </>
  );
}
