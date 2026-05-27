import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useState, useEffect } from "react";
import Toast from "@/lib/toast-polyfill";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { CloudinaryImage } from "@/components/ui/CloudinaryImage";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUpdateProfile } from "@/lib/hooks/use-users";
import { useUpload } from "@/lib/hooks/use-upload";
import { useImagePicker } from "@/lib/hooks/use-image-picker";
import { BackButton } from "@/components/ui/BackButton";

export default function EditProfileScreen() {
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
      setPhone(user.phone || "");
      setBio(user.bio || "");
      setLocation(user.location || "");
      setAvatarUrl(user.image || "");
    }
  }, [user]);

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      Toast.show({ type: "error", text1: "Missing Fields", text2: "Name and Email are required." });
      return;
    }

    setIsSaving(true);

    updateProfile.mutateAsync({ name, image: avatarUrl })
      .then((res) => {
        setUser(res.data);
        Toast.show({ type: "success", text1: "Profile Updated", text2: "Your details have been saved successfully." });
        router.back();
      })
      .catch(() => {
        Toast.show({ type: "error", text1: "Update Failed", text2: "Could not save your profile. Try again." });
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
      setAvatarUrl((res as any).publicId || res.url);
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
        <Text className="text-[20px] font-heading font-black text-foreground">
          Edit Profile
        </Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1 px-5" 
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View className="items-center mb-8">
            <View className="relative">
              <View className="w-24 h-24 rounded-full overflow-hidden border-4 border-card shadow-sm bg-accent">
                {avatarUrl ? (
                  <CloudinaryImage publicId={avatarUrl} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <View className="w-full h-full items-center justify-center bg-brand-100">
                    <Text className="text-[32px] font-heading font-black text-brand-600">
                      {name ? name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
              </View>
              <Pressable 
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="absolute bottom-0 right-0 w-8 h-8 bg-brand-600 rounded-full items-center justify-center border-2 border-card"
                onPress={handleChangePhoto}
                disabled={isSaving}
              >
                <Icon name="camera" size={14} color="#ffffff" />
              </Pressable>
            </View>
          </View>

          {/* Form Fields */}
          <View className="bg-card rounded-[24px] p-5 border border-border shadow-sm mb-6">
            <View className="mb-4">
              <Text className="text-[14px] font-bold text-foreground font-heading mb-2 ml-1">Full Name</Text>
              <View className="h-12 bg-background rounded-[16px] px-4 justify-center border border-border">
                <TextInput
                  className="text-[15px] font-body text-foreground flex-1"
                  placeholder="Enter your full name"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                  editable={!isSaving}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-[14px] font-bold text-foreground font-heading mb-2 ml-1">Email Address</Text>
              <View className="h-12 bg-background rounded-[16px] px-4 justify-center border border-border">
                <TextInput
                  className="text-[15px] font-body text-foreground flex-1"
                  placeholder="Enter your email"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isSaving}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-[14px] font-bold text-foreground font-heading mb-2 ml-1">Phone Number (Optional)</Text>
              <View className="h-12 bg-background rounded-[16px] px-4 justify-center border border-border">
                <TextInput
                  className="text-[15px] font-body text-foreground flex-1"
                  placeholder="e.g. +233 50 123 4567"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  editable={!isSaving}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-[14px] font-bold text-foreground font-heading mb-2 ml-1">Location</Text>
              <View className="h-12 bg-background rounded-[16px] px-4 justify-center border border-border">
                <TextInput
                  className="text-[15px] font-body text-foreground flex-1"
                  placeholder="e.g. Accra, Ghana"
                  placeholderTextColor="#94a3b8"
                  value={location}
                  onChangeText={setLocation}
                  editable={!isSaving}
                />
              </View>
            </View>

            <View className="mb-2">
              <Text className="text-[14px] font-bold text-foreground font-heading mb-2 ml-1">Bio (Optional)</Text>
              <View className="min-h-[100px] bg-background rounded-[16px] px-4 py-3 border border-border">
                <TextInput
                  className="text-[15px] font-body text-foreground flex-1"
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
