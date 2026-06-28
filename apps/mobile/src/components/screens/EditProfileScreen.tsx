import { BackButton } from "@/components/ui/BackButton";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import Toast from "@/lib/toast-polyfill";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUpdateProfile } from "@/lib/hooks/use-users";
import { useUpload } from "@/lib/hooks/use-upload";
import { useImagePicker } from "@/lib/hooks/use-image-picker";

export function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuthStore();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const upload = useUpload();
  const { pickImage } = useImagePicker({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phoneNumber || user.phone || "");
      setBio(user.bio || "");
      setLocation(user.location || "");
      setAvatarUrl(
        user.image ||
          `https://api.dicebear.com/9.x/micah/png?seed=${encodeURIComponent(user.name || "Bexiemart")}&backgroundColor=b6e3f4,c0aede,d1d4f9`
      );
    }
  }, [user]);

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      Toast.show({ type: "error", text1: "Missing Fields", text2: "Name and Email are required." });
      return;
    }

    setIsSaving(true);

    updateProfile
      .mutateAsync({ name, image: avatarUrl })
      .then((res) => {
        setUser(res.data);
        Toast.show({
          type: "success",
          text1: "Profile Updated",
          text2: "Your details have been saved successfully.",
        });
        router.back();
      })
      .catch(() => {
        Toast.show({
          type: "error",
          text1: "Update Failed",
          text2: "Could not save your profile. Try again.",
        });
      })
      .finally(() => setIsSaving(false));
  };

  const handleChangePhoto = async () => {
    const result = await pickImage();
    if (!result) return;
    const file = Array.isArray(result) ? result[0] : result;
    setIsUploading(true);
    try {
      const res = await upload.mutateAsync(file);
      setAvatarUrl((res as any).url || (res as any).publicId);
    } catch {
      Alert.alert("Upload Failed", "Could not upload image. Try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center gap-3"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton />
        <Text className="text-display-sm font-heading font-black text-foreground">
          Edit Profile
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View className="items-center mb-8">
            <Avatar
              uri={avatarUrl}
              name={name || user?.name || "Bexiemart"}
              size={96}
              fallback="dicebear"
              editable={!isSaving}
              onPress={handleChangePhoto}
            />
          </View>

          {/* Form Fields */}
          <View className="bg-card rounded-2xl p-5 border border-border mb-6">
            <View className="mb-4">
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                editable={!isSaving}
              />
            </View>

            <View className="mb-4">
              <Input
                label="Email Address"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!isSaving}
              />
            </View>

            <View className="mb-4">
              <Input
                label="Phone Number (Optional)"
                placeholder="e.g. +233 50 123 4567"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                editable={!isSaving}
              />
            </View>

            <View className="mb-4">
              <Input
                label="Location"
                placeholder="e.g. Accra, Ghana"
                value={location}
                onChangeText={setLocation}
                editable={!isSaving}
              />
            </View>

            <View className="mb-2">
              <Text className="text-body-md font-bold text-foreground font-heading mb-2 ml-1">
                Bio (Optional)
              </Text>
              <View className="min-h-[100px] bg-background rounded-xl px-4 py-3 border border-border">
                <TextInput
                  className="text-body-lg font-body text-foreground flex-1"
                  placeholder="Tell us a bit about yourself..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  textAlignVertical="top"
                  value={bio}
                  onChangeText={setBio}
                  editable={!isSaving}
                />
              </View>
            </View>
          </View>

          <Button
            title={isSaving ? "Saving..." : "Save Changes"}
            size="lg"
            className="w-full rounded-full"
            disabled={isSaving}
            onPress={handleSave}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
