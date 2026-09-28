import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Alert, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useCreateService,
  useUpdateService,
  useVendorServices,
} from "@/lib/hooks/use-vendor-services";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PhotoPicker, type PickerImage } from "@/components/ui/PhotoPicker";
import { uploadApi, uploadErrorMessage } from "@/lib/api/upload";
import { useState } from "react";

export default function AddServiceScreen() {
  const router = useRouter();
  const { mode, id } = useLocalSearchParams<{ mode?: string; id?: string }>();
  const isEdit = mode === "edit" && !!id;

  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const { data: services } = useVendorServices();
  const existing = isEdit
    ? (Array.isArray(services) ? services : []).find((s: any) => s.id === id)
    : undefined;

  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [pricingModel, setPricingModel] = useState<"fixed" | "hourly">("fixed");
  const [duration, setDuration] = useState("");
  const [coverImages, setCoverImages] = useState<PickerImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Toggles
  const [locationType, setLocationType] = useState<"in_person" | "remote">("in_person");

  // Prefill once the service loads (state adjusted during render, per the
  // React docs); the existing cover keeps its url so it isn't uploaded again.
  const [prefilledFrom, setPrefilledFrom] = useState<unknown>(null);
  if (existing && prefilledFrom !== existing) {
    setPrefilledFrom(existing);
    setName(existing.name ?? "");
    setCategory(existing.category ?? "");
    setDescription(existing.description ?? "");
    setPrice(existing.price != null ? String(Number(existing.price)) : "");
    if (existing.priceDisplay?.includes("/hr")) setPricingModel("hourly");
    if (existing.imageUrl) {
      setCoverImages([
        { uri: existing.imageUrl, url: existing.imageUrl, type: "image/jpeg", name: "cover.jpg" },
      ]);
    }
  }

  const loading = createMutation.isPending || updateMutation.isPending || isUploading;

  const handleSubmit = async () => {
    const priceNum = parseFloat(price);
    if (!name.trim() || isNaN(priceNum)) {
      Alert.alert("Required", "Service name and price are required.");
      return;
    }
    const cover = coverImages[0];
    if (!cover) {
      Alert.alert("Cover photo required", "Add a cover photo so customers can see your service.");
      return;
    }

    let imageUrl = cover.url;
    if (!imageUrl) {
      setIsUploading(true);
      try {
        imageUrl = (await uploadApi.uploadFile(cover)).url;
      } catch (error) {
        Alert.alert(
          "Upload Failed",
          uploadErrorMessage(error, "Could not upload your cover photo. Please try again.")
        );
        return;
      } finally {
        setIsUploading(false);
      }
    }

    // Only fields the API accepts: pricing model and duration are folded into
    // the display price customers see.
    const priceDisplay = [
      `GH₵ ${priceNum.toFixed(2)}${pricingModel === "hourly" ? "/hr" : ""}`,
      duration.trim(),
    ]
      .filter(Boolean)
      .join(" · ");
    const formData = {
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      price: priceNum,
      priceDisplay,
      imageUrl,
    };

    if (isEdit) {
      updateMutation.mutate(
        { ...formData, id: id! },
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
        <Text className="text-display-sm font-heading font-black text-foreground">
          {isEdit ? "Edit Service" : "Add Service"}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pb-12 pt-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Photo */}
        <PhotoPicker
          images={coverImages}
          onChange={setCoverImages}
          maxSelections={1}
          allowsMultipleSelection={false}
        />

        <View className="gap-5">
          <View className="bg-card p-5 rounded-2xl border border-border">
            <Text className="text-body-lg font-bold text-foreground mb-4">Basic Details</Text>
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

          <View className="bg-card p-5 rounded-2xl border border-border">
            <Text className="text-body-lg font-bold text-foreground mb-4">Pricing Model</Text>
            <View className="flex-row bg-muted p-1 rounded-xl mb-4">
              <Pressable
                onPress={() => setPricingModel("fixed")}
                className={`flex-1 py-2 items-center justify-center rounded-lg ${pricingModel === "fixed" ? "bg-card border border-border" : ""}`}
              >
                <Text
                  className={`text-sm font-bold ${pricingModel === "fixed" ? "text-foreground" : "text-muted-foreground"}`}
                >
                  Fixed Price
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPricingModel("hourly")}
                className={`flex-1 py-2 items-center justify-center rounded-lg ${pricingModel === "hourly" ? "bg-card border border-border" : ""}`}
              >
                <Text
                  className={`text-sm font-bold ${pricingModel === "hourly" ? "text-foreground" : "text-muted-foreground"}`}
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

          <View className="bg-card p-5 rounded-2xl border border-border">
            <Text className="text-body-lg font-bold text-foreground mb-4">Location</Text>
            <View className="flex-row bg-muted p-1 rounded-xl">
              <Pressable
                onPress={() => setLocationType("in_person")}
                className={`flex-1 py-2 items-center justify-center rounded-lg ${locationType === "in_person" ? "bg-card border border-border" : ""}`}
              >
                <Text
                  className={`text-sm font-bold ${locationType === "in_person" ? "text-foreground" : "text-muted-foreground"}`}
                >
                  In-Person
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setLocationType("remote")}
                className={`flex-1 py-2 items-center justify-center rounded-lg ${locationType === "remote" ? "bg-card border border-border" : ""}`}
              >
                <Text
                  className={`text-sm font-bold ${locationType === "remote" ? "text-foreground" : "text-muted-foreground"}`}
                >
                  Remote / Digital
                </Text>
              </Pressable>
            </View>
            {locationType === "in_person" && (
              <Text className="text-body-sm text-muted-foreground mt-3 ml-1">
                Customers will see your registered business address.
              </Text>
            )}
          </View>

          <View className="mt-6 gap-3">
            <Button
              title={
                isUploading ? "Uploading Photo..." : isEdit ? "Update Service" : "Publish Service"
              }
              size="lg"
              loading={loading}
              onPress={handleSubmit}
              className="w-full"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
