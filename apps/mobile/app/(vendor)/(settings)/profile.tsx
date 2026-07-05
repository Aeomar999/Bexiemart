import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState, useEffect } from "react";
import { Image } from "expo-image";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useVendorProfile, useUpdateShop } from "@/lib/hooks/use-vendor";
import { useUpload } from "@/lib/hooks/use-upload";
import { useImagePicker } from "@/lib/hooks/use-image-picker";
import { useFormValidation } from "@/lib/hooks/use-form-validation";
import { shopSchema } from "@/lib/validation/schemas";
import { ProfileSkeleton } from "@/components/ui/LoadingState";
import { CoverHeader } from "@/components/ui/CoverHeader";

export default function VendorProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState(user?.name || "My Store");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const { data: profile } = useVendorProfile();
  const { validate, errors } = useFormValidation(shopSchema);

  // Photo Upload State
  const [isPhotoModalVisible, setPhotoModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoTarget, setPhotoTarget] = useState<"banner" | "logo" | null>(null);

  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  useEffect(() => {
    if (profile) {
      setStoreName(profile.shopName ?? storeName);
      setDescription(profile.description ?? "");
      setPhone(profile.phone ?? "");
      setAddress(profile.address ?? "");
      setLogoUrl(profile.logo ?? "");
      setBannerUrl(profile.banner ?? "");
    }
  }, [profile]);

  const updateShop = useUpdateShop();
  const upload = useUpload();
  const logoPicker = useImagePicker({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
  const bannerPicker = useImagePicker({ allowsEditing: true, aspect: [16, 9], quality: 0.7 });

  const handlePhotoOption = async (option: string) => {
    const picker = photoTarget === "banner" ? bannerPicker : logoPicker;
    const result = option === "camera" ? await picker.takePhoto() : await picker.pickImage();
    if (!result) {
      setPhotoModalVisible(false);
      return;
    }
    const file = Array.isArray(result) ? result[0] : result;
    setIsUploading(true);
    try {
      const res = await upload.mutateAsync(file);
      if (photoTarget === "banner") setBannerUrl(res.url);
      else setLogoUrl(res.url);
      setPhotoModalVisible(false);
      Alert.alert(
        "Success",
        `${photoTarget === "banner" ? "Cover photo" : "Logo"} updated successfully!`
      );
    } catch {
      Alert.alert("Upload Failed", "Could not upload image.");
    } finally {
      setIsUploading(false);
      setPhotoTarget(null);
    }
  };

  const handleSave = () => {
    if (
      !validate({
        shopName: storeName,
        description,
        phone,
        address,
        logo: logoUrl,
        banner: bannerUrl,
      })
    ) {
      Alert.alert("Validation Error", "Please correct the errors before saving.");
      return;
    }
    setLoading(true);
    updateShop
      .mutateAsync({
        shopName: storeName,
        description,
        phone,
        address,
        logo: logoUrl || undefined,
        banner: bannerUrl || undefined,
      })
      .then(() => {
        Alert.alert("Success", "Store profile updated successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      })
      .catch(() => {
        Alert.alert("Error", "Failed to update store profile.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="mr-3" />
        <Text className="text-display-sm font-heading font-black text-foreground">
          Store Profile
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pb-12 pt-6 gap-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Banner & Logo */}
        <View className="items-center mb-4">
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
            onPress={() => {
              setPhotoTarget("banner");
              setPhotoModalVisible(true);
            }}
            className="w-full rounded-2xl overflow-hidden mb-[-40px]"
          >
            <CoverHeader
              imageUrl={bannerUrl || null}
              height={128}
              fallbackIcon="camera"
              fallbackIconColor="#64748b"
            />
          </Pressable>

          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
            onPress={() => {
              setPhotoTarget("logo");
              setPhotoModalVisible(true);
            }}
            className="w-[100px] h-[100px] rounded-full bg-card items-center justify-center border-4 border-card shadow-sm overflow-hidden z-10 relative"
          >
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <View className="w-full h-full bg-primary-subtle items-center justify-center">
                <Text className="text-display-lg font-heading font-black text-primary">
                  {storeName ? storeName.charAt(0).toUpperCase() : "S"}
                </Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 left-0 h-1/3 bg-black/30 items-center justify-center">
              <Icon name="camera" size={14} color="#ffffff" />
            </View>
          </Pressable>
        </View>

        <View className="bg-card rounded-2xl border border-border p-5 gap-4">
          <Text className="text-body-lg font-bold text-foreground mb-2">Basic Info</Text>
          <Input
            label="Store Name"
            placeholder="Enter store name"
            value={storeName}
            onChangeText={setStoreName}
            error={errors.shopName}
          />
          <Input
            label="Store Description"
            placeholder="Tell customers about your store"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            error={errors.description}
          />
        </View>

        <View className="bg-card rounded-2xl border border-border p-5 gap-4">
          <Text className="text-body-lg font-bold text-foreground mb-2">Contact Info</Text>
          <Input
            label="Phone Number"
            placeholder="+233 XX XXX XXXX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            error={errors.phone}
          />
          <Input
            label="Physical Address"
            placeholder="Store location"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
            error={errors.address}
          />
        </View>

        <Button
          title="Save Changes"
          size="lg"
          loading={loading}
          onPress={handleSave}
          className="w-full mt-4"
        />
      </ScrollView>

      {/* Photo Action Sheet */}
      <Modal
        visible={isPhotoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isUploading && setPhotoModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable
            className="absolute inset-0"
            onPress={() => !isUploading && setPhotoModalVisible(false)}
          />
          <View className="bg-card rounded-t-3xl p-6 pb-12">
            <View className="w-12 h-1.5 bg-secondary rounded-full self-center mb-6" />
            <Text className="text-display-sm font-heading font-bold text-foreground mb-6">
              Update {photoTarget === "banner" ? "Cover Photo" : "Store Logo"}
            </Text>

            {isUploading ? (
              <View className="py-8 items-center justify-center">
                <ProfileSkeleton />
                <Text className="mt-4 text-body-lg font-bold text-muted-foreground">
                  Uploading photo...
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="flex-row items-center p-4 bg-background border border-border rounded-2xl"
                  onPress={() => handlePhotoOption("camera")}
                >
                  <View className="w-12 h-12 bg-card rounded-full items-center justify-center border border-border">
                    <Icon name="camera" size={20} color="#0f172a" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-body-lg font-bold text-foreground mb-0.5">
                      Take Photo
                    </Text>
                    <Text className="text-sm font-body text-muted-foreground">Use your camera</Text>
                  </View>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="flex-row items-center p-4 bg-background border border-border rounded-2xl"
                  onPress={() => handlePhotoOption("library")}
                >
                  <View className="w-12 h-12 bg-card rounded-full items-center justify-center border border-border">
                    <Icon name="image" size={20} color="#0f172a" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-body-lg font-bold text-foreground mb-0.5">
                      Choose from Library
                    </Text>
                    <Text className="text-sm font-body text-muted-foreground">
                      Select from camera roll
                    </Text>
                  </View>
                </Pressable>

                {photoTarget === "logo" && (
                  <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    className="flex-row items-center p-4 bg-rose-50 border border-rose-100 rounded-2xl mt-2"
                    onPress={() => {
                      setPhotoModalVisible(false);
                      setPhotoTarget(null);
                    }}
                  >
                    <View className="w-12 h-12 bg-card rounded-full items-center justify-center border border-rose-100">
                      <Icon name="trash-2" size={20} color="#ef4444" />
                    </View>
                    <View className="ml-4 flex-1">
                      <Text className="text-body-lg font-bold text-error mb-0.5">Remove Logo</Text>
                      <Text className="text-sm font-body text-rose-500">
                        Revert to default initial
                      </Text>
                    </View>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
