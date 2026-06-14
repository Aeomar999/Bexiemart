import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Alert, Pressable, Switch } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCreateService, useUpdateService } from "@/lib/hooks/use-vendor-services";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useState } from "react";

export default function AddServiceScreen() {
  const router = useRouter();
  const { mode, id } = useLocalSearchParams();
  const isEdit = mode === "edit";

  const createMutation = useCreateService();
  const updateMutation = useUpdateService();

  const insets = useSafeAreaInsets();
  const [name, setName] = useState(isEdit ? "Deep Tissue Massage" : "");
  const [category, setCategory] = useState(isEdit ? "Wellness" : "");
  const [description, setDescription] = useState(isEdit ? "Professional deep tissue massage." : "");
  const [price, setPrice] = useState(isEdit ? "200.00" : "");
  const [pricingModel, setPricingModel] = useState<"fixed" | "hourly" | "starting_at">(
    isEdit ? "fixed" : "fixed"
  );
  const [duration, setDuration] = useState(isEdit ? "60 mins" : "");

  // Toggles
  const [locationType, setLocationType] = useState<"in_person" | "remote">(
    isEdit ? "in_person" : "in_person"
  );

  const loading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (status: "active" | "draft") => {
    if (!name || !price) {
      Alert.alert("Required", "Service name and price are required.");
      return;
    }
    const formData = {
      name,
      category,
      description,
      price: parseFloat(price),
      pricingModel,
      duration,
      locationType,
      status,
    };
    if (isEdit) {
      updateMutation.mutate(
        { ...formData, id },
        {
          onSuccess: () => {
            Alert.alert("Updated", "Service updated successfully!");
            router.back();
          },
          onError: () => Alert.alert("Error", "Failed to update service."),
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          Alert.alert("Published", "Service published successfully!");
          router.back();
        },
        onError: () => Alert.alert("Error", "Failed to create service."),
      });
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Custom Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="mr-3" />
        <Text className="text-[20px] font-heading font-black text-foreground">
          {isEdit ? "Edit Service" : "Add Service"}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pb-12 pt-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Image Upload Area */}
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          className="w-full h-48 bg-muted rounded-[20px] items-center justify-center border-2 border-dashed border-border mb-8"
        >
          <View className="w-14 h-14 bg-card rounded-full items-center justify-center mb-3">
            <Icon name="camera" size={24} color="#64748b" />
          </View>
          <Text className="text-[14px] font-bold text-muted-foreground">Add Cover Photo</Text>
          <Text className="text-[12px] text-muted-foreground mt-1">
            Make your service stand out
          </Text>
        </Pressable>

        <View className="gap-5">
          <View>
            <Text className="text-[16px] font-bold text-foreground mb-4">Basic Details</Text>
            <View className="gap-4">
              <Input
                label="Service Name"
                placeholder="e.g. Deep Tissue Massage"
                value={name}
                onChangeText={setName}
              />
              <Input
                label="Category"
                placeholder="e.g. Wellness"
                value={category}
                onChangeText={setCategory}
              />
              <Input
                label="Description"
                placeholder="Describe what's included..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <View className="h-px bg-secondary my-2" />

          <View>
            <Text className="text-[16px] font-bold text-foreground mb-4">Pricing Model</Text>
            <View className="flex-row bg-muted p-1 rounded-xl mb-4">
              <Pressable
                onPress={() => setPricingModel("fixed")}
                className={`flex-1 py-2 items-center justify-center rounded-lg ${pricingModel === "fixed" ? "bg-card border border-border" : ""}`}
              >
                <Text
                  className={`text-[13px] font-bold ${pricingModel === "fixed" ? "text-foreground" : "text-muted-foreground"}`}
                >
                  Fixed Price
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPricingModel("hourly")}
                className={`flex-1 py-2 items-center justify-center rounded-lg ${pricingModel === "hourly" ? "bg-card border border-border" : ""}`}
              >
                <Text
                  className={`text-[13px] font-bold ${pricingModel === "hourly" ? "text-foreground" : "text-muted-foreground"}`}
                >
                  Hourly Rate
                </Text>
              </Pressable>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label={pricingModel === "fixed" ? "Price (GHS)" : "Rate per Hour (GHS)"}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Duration (e.g. 60 mins)"
                  placeholder="60 mins"
                  value={duration}
                  onChangeText={setDuration}
                />
              </View>
            </View>
          </View>

          <View className="h-px bg-secondary my-2" />

          <View>
            <Text className="text-[16px] font-bold text-foreground mb-4">Location</Text>
            <View className="flex-row bg-muted p-1 rounded-xl">
              <Pressable
                onPress={() => setLocationType("in_person")}
                className={`flex-1 py-2 items-center justify-center rounded-lg ${locationType === "in_person" ? "bg-card border border-border" : ""}`}
              >
                <Text
                  className={`text-[13px] font-bold ${locationType === "in_person" ? "text-foreground" : "text-muted-foreground"}`}
                >
                  In-Person
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setLocationType("remote")}
                className={`flex-1 py-2 items-center justify-center rounded-lg ${locationType === "remote" ? "bg-card border border-border" : ""}`}
              >
                <Text
                  className={`text-[13px] font-bold ${locationType === "remote" ? "text-foreground" : "text-muted-foreground"}`}
                >
                  Remote / Digital
                </Text>
              </Pressable>
            </View>
            {locationType === "in_person" && (
              <Text className="text-[12px] text-muted-foreground mt-3 ml-1">
                Customers will see your registered business address.
              </Text>
            )}
          </View>

          <View className="mt-6 gap-3">
            <Button
              title={isEdit ? "Update Service" : "Publish Service"}
              size="lg"
              loading={loading}
              onPress={() => handleSubmit("active")}
              className="w-full"
            />
            <Pressable
              onPress={() => handleSubmit("draft")}
              className="w-full py-4 items-center rounded-full border border-border bg-card"
            >
              <Text className="text-[15px] font-bold text-muted-foreground">Save as Draft</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
