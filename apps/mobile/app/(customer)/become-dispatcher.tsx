import { tokens } from "@/theme/tokens";
import { BackButton } from "@/components/ui/BackButton";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useCreateDispatcherProfile } from "@/lib/hooks/use-dispatcher";
import { useAuthStore } from "@/lib/stores/auth-store";
import Toast from "@/lib/toast-polyfill";

export default function BecomeDispatcherScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const createProfile = useCreateDispatcherProfile();

  const [form, setForm] = useState({
    vehicleType: "bike",
    licensePlate: "",
    licenseNumber: "",
  });

  const handleSubmit = async () => {
    if (!form.licensePlate || !form.licenseNumber) {
      Toast.show({ type: "error", text1: "Missing Fields", text2: "Please fill all the details." });
      return;
    }

    createProfile.mutate(form, {
      onSuccess: () => {
        // Optimistically update the user role
        if (user) {
          setUser({ ...user, role: "dispatcher" });
        }
        Toast.show({
          type: "success",
          text1: "Welcome!",
          text2: "You are now a Bexiemart Dispatcher.",
        });

        // Root index.tsx will auto-redirect based on role
        router.replace("/");
      },
      onError: (err: any) => {
        Toast.show({
          type: "error",
          text1: "Application Failed",
          text2: err.response?.data?.message || err.message,
        });
      },
    });
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card flex-row items-center border-b border-border"
        style={{ paddingTop: Math.max(insets.top, 12) + 12 }}
      >
        <BackButton className="-ml-2 mr-2" />
        <Text className="text-display-sm font-heading font-black text-foreground">
          Drive with us
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" contentContainerClassName="pb-10">
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-primary-subtle rounded-full items-center justify-center mb-4">
            <Icon name="truck" size={32} color={tokens.primary} />
          </View>
          <Text className="text-2xl font-black font-heading text-foreground mb-2 text-center">
            Earn money on your schedule
          </Text>
          <Text className="text-muted-foreground font-body text-center">
            Deliver food and groceries to students around campus and get paid weekly.
          </Text>
        </View>

        {/* Vehicle Type Selection */}
        <Text className="text-body-lg font-bold font-body text-foreground mb-2">Vehicle Type</Text>
        <View className="flex-row gap-3 mb-6">
          {["bike", "car"].map((type) => {
            const isSelected = form.vehicleType === type;
            return (
              <Pressable
                key={type}
                onPress={() => setForm((prev) => ({ ...prev, vehicleType: type }))}
                className={`flex-1 p-4 rounded-xl items-center border ${isSelected ? "border-primary bg-primary-subtle" : "border-border bg-card"}`}
              >
                <Icon
                  name={type === "bike" ? "briefcase" : "truck"}
                  size={24}
                  color={isSelected ? tokens.primary : "#64748b"}
                />
                <Text
                  className={`mt-2 font-bold font-body capitalize ${isSelected ? "text-primary-hover" : "text-muted-foreground"}`}
                >
                  {type}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="text-body-lg font-bold font-body text-foreground mb-2">
          License Plate Number
        </Text>
        <TextInput
          value={form.licensePlate}
          onChangeText={(val) => setForm((prev) => ({ ...prev, licensePlate: val }))}
          placeholder="e.g. AS-1234-21"
          className="bg-card border border-border p-4 rounded-xl font-body text-body-lg mb-6 text-foreground"
          placeholderTextColor="#94a3b8"
        />

        <Text className="text-body-lg font-bold font-body text-foreground mb-2">
          Driver's License ID
        </Text>
        <TextInput
          value={form.licenseNumber}
          onChangeText={(val) => setForm((prev) => ({ ...prev, licenseNumber: val }))}
          placeholder="Enter license ID"
          className="bg-card border border-border p-4 rounded-xl font-body text-body-lg mb-8 text-foreground"
          placeholderTextColor="#94a3b8"
        />

        <Pressable
          onPress={handleSubmit}
          disabled={createProfile.isPending}
          className="bg-primary p-4 rounded-xl items-center justify-center flex-row h-14"
        >
          {createProfile.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold font-heading text-body-lg">
              Submit Application
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
