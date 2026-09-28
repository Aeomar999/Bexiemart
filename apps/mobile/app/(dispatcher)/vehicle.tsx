import { tokens } from "@/theme/tokens";
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "@/lib/toast-polyfill";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { useDispatcherProfile, useUpdateDispatcherProfile } from "@/lib/hooks/use-dispatcher";
import type { DispatcherVehicleType, UpdateDispatcherProfileDto } from "@/lib/api/dispatcher";

const VEHICLES: { id: DispatcherVehicleType; label: string; icon: string }[] = [
  { id: "bike", label: "Bike", icon: "motorbike" },
  { id: "car", label: "Car", icon: "car" },
  { id: "van", label: "Van", icon: "van" },
];

// Mirrors the server's UpdateDispatcherProfileDto rule.
const PLATE_PATTERN = /^[A-Z0-9][A-Z0-9 -]{1,18}[A-Z0-9]$/;

const normalisePlate = (value: string) => value.trim().replace(/\s+/g, " ").toUpperCase();

const toVehicleType = (value?: string) => VEHICLES.find((v) => v.id === value?.toLowerCase())?.id;

export default function VehicleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { field } = useLocalSearchParams<{ field?: string }>();
  const { data: profile } = useDispatcherProfile();
  const updateProfile = useUpdateDispatcherProfile();

  // Local edits override the saved profile until they're saved.
  const [editedType, setEditedType] = useState<DispatcherVehicleType>();
  const [editedPlate, setEditedPlate] = useState<string>();

  const savedType = toVehicleType(profile?.vehicleType);
  const savedPlate = profile?.plateNumber ?? "";
  const vehicleType = editedType ?? savedType;
  const plate = editedPlate ?? savedPlate;
  const normalisedPlate = normalisePlate(plate);

  const typeChanged = !!vehicleType && vehicleType !== savedType;
  const plateChanged = normalisedPlate !== normalisePlate(savedPlate);
  const plateError =
    plateChanged && !PLATE_PATTERN.test(normalisedPlate)
      ? "Use 3–20 letters, numbers, spaces or dashes."
      : undefined;
  const canSave = (typeChanged || plateChanged) && !plateError && !updateProfile.isPending;

  const handleSave = () => {
    const payload: UpdateDispatcherProfileDto = {};
    if (typeChanged) payload.vehicleType = vehicleType;
    if (plateChanged) payload.plateNumber = normalisedPlate;

    updateProfile.mutate(payload, {
      onSuccess: () => {
        Toast.show({ type: "success", text1: "Vehicle updated" });
        router.back();
      },
      onError: () => {
        Toast.show({
          type: "error",
          text1: "Couldn't save your vehicle",
          text2: "Check your connection and try again.",
        });
      },
    });
  };

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center gap-3"
        style={{ paddingTop: Math.max(insets.top, 12) + 12 }}
      >
        <BackButton />
        <Text className="text-display-sm font-heading font-black text-foreground">Vehicle</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="pt-6 pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-[12px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 px-2">
            Type
          </Text>
          <View accessibilityRole="radiogroup" className="flex-row gap-3 mb-8">
            {VEHICLES.map((vehicle) => {
              const isSelected = vehicle.id === vehicleType;
              return (
                <Pressable
                  key={vehicle.id}
                  accessibilityRole="radio"
                  accessibilityLabel={vehicle.label}
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => setEditedType(vehicle.id)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className={`flex-1 items-center py-4 rounded-[16px] border ${
                    isSelected ? "border-primary bg-primary-subtle" : "border-border bg-card"
                  }`}
                >
                  <Icon
                    name={vehicle.icon}
                    size={24}
                    color={isSelected ? tokens.primary : tokens.textMuted}
                  />
                  <Text
                    className={`mt-2 text-[14px] font-bold ${
                      isSelected ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {vehicle.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="text-[12px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 px-2">
            Licence plate
          </Text>
          <Input
            accessibilityLabel="Licence plate"
            placeholder="e.g. AS-1234-21"
            value={plate}
            onChangeText={setEditedPlate}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus={field === "plate"}
            maxLength={24}
            returnKeyType="done"
            error={plateError}
            hint="Customers see this while tracking their delivery."
          />

          <Button
            title="Save changes"
            size="lg"
            className="w-full rounded-full mt-8"
            loading={updateProfile.isPending}
            disabled={!canSave}
            onPress={handleSave}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
