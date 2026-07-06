import { tokens } from "@/theme/tokens";
import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Alert, Pressable, FlatList } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useState } from "react";

const CATEGORIES = ["Fast Food", "Local", "Healthy", "Desserts", "Pizza", "Salads"];

export default function AddFoodScreen() {
  const router = useRouter();
  const { mode, id } = useLocalSearchParams();
  const isEdit = mode === "edit";

  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post("/food/items", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["food", "items"] }),
  });

  const insets = useSafeAreaInsets();
  const [name, setName] = useState(isEdit ? "Spicy Chicken Burger" : "");
  const [category, setCategory] = useState(isEdit ? "Fast Food" : "Fast Food");
  const [description, setDescription] = useState(isEdit ? "A delicious spicy chicken burger." : "");
  const [price, setPrice] = useState(isEdit ? "45.00" : "");
  const [prepTime, setPrepTime] = useState(isEdit ? "15-20 mins" : "");

  const [status, setStatus] = useState<"available" | "sold_out">("available");

  const [dietaryTags, setDietaryTags] = useState({
    spicy: isEdit,
    vegan: false,
    glutenFree: false,
    halal: false,
  });

  const toggleTag = (key: keyof typeof dietaryTags) => {
    setDietaryTags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const loading = createMutation.isPending;

  const handleSubmit = (saveStatus: "active" | "draft") => {
    if (!name || !price) {
      Alert.alert("Required", "Meal name and price are required.");
      return;
    }
    const formData = {
      name,
      category,
      description,
      price: parseFloat(price),
      prepTime,
      dietaryTags: Object.entries(dietaryTags)
        .filter(([, v]) => v)
        .map(([k]) => k),
      status: saveStatus === "active" ? status : "draft",
    };
    createMutation.mutate(formData, {
      onSuccess: () => {
        Alert.alert("Published", "Food item published successfully!");
        router.back();
      },
      onError: () => Alert.alert("Error", "Failed to create food item."),
    });
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
          {isEdit ? "Edit Food Item" : "Add Food Item"}
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
          className="w-full h-48 bg-muted rounded-2xl items-center justify-center border-2 border-dashed border-border mb-8"
        >
          <View className="w-14 h-14 bg-card rounded-full items-center justify-center mb-3">
            <Icon name="camera" size={24} color="#64748b" />
          </View>
          <Text className="text-body-md font-bold text-muted-foreground">
            Add Mouthwatering Photos
          </Text>
          <Text className="text-body-sm text-muted-foreground mt-1">Upload up to 3 images</Text>
        </Pressable>

        <View className="gap-5">
          <View>
            <Text className="text-body-lg font-bold text-foreground mb-4">Meal Details</Text>
            <View className="gap-4">
              <Input
                label="Item Name"
                placeholder="e.g. Spicy Jollof Rice"
                value={name}
                onChangeText={setName}
              />

              {/* Horizontal Category Selector */}
              <View>
                <Text className="text-body-md font-bold text-muted-foreground mb-2">Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => setCategory(cat)}
                        className={`px-4 py-2 rounded-full border ${category === cat ? "bg-foreground border-border" : "bg-card border-border"}`}
                      >
                        <Text
                          className={`text-sm font-bold ${category === cat ? "text-white" : "text-muted-foreground"}`}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <Input
                label="Description & Ingredients"
                placeholder="Describe the meal and main ingredients..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <View className="h-px bg-secondary my-2" />

          <View>
            <Text className="text-body-lg font-bold text-foreground mb-4">Pricing & Timing</Text>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="Price (GHS)"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Prep Time"
                  placeholder="e.g. 15-20 mins"
                  value={prepTime}
                  onChangeText={setPrepTime}
                />
              </View>
            </View>
          </View>

          <View className="h-px bg-secondary my-2" />

          <View>
            <Text className="text-body-lg font-bold text-foreground mb-4">Dietary Tags</Text>
            <View className="flex-row flex-wrap gap-3">
              {[
                { id: "spicy", label: "Spicy", icon: "activity" },
                { id: "vegan", label: "Vegan", icon: "feather" },
                { id: "glutenFree", label: "Gluten-Free", icon: "shield" },
                { id: "halal", label: "Halal", icon: "check-circle" },
              ].map((tag) => (
                <Pressable
                  key={tag.id}
                  onPress={() => toggleTag(tag.id as keyof typeof dietaryTags)}
                  className={`flex-row items-center px-4 py-2.5 rounded-xl border ${dietaryTags[tag.id as keyof typeof dietaryTags] ? "bg-primary-subtle border-border" : "bg-card border-border"}`}
                >
                  <Icon
                    name={tag.icon}
                    size={14}
                    color={
                      dietaryTags[tag.id as keyof typeof dietaryTags] ? tokens.primary : "#64748b"
                    }
                  />
                  <Text
                    className={`ml-2 text-sm font-bold ${dietaryTags[tag.id as keyof typeof dietaryTags] ? "text-primary-hover" : "text-muted-foreground"}`}
                  >
                    {tag.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="h-px bg-secondary my-2" />

          <View>
            <Text className="text-body-lg font-bold text-foreground mb-4">Availability</Text>
            <View className="flex-row bg-muted p-1 rounded-xl">
              <Pressable
                onPress={() => setStatus("available")}
                className={`flex-1 py-3 items-center justify-center rounded-lg ${status === "available" ? "bg-card border border-border" : ""}`}
              >
                <Text
                  className={`text-body-md font-bold ${status === "available" ? "text-green-600" : "text-muted-foreground"}`}
                >
                  Available
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setStatus("sold_out")}
                className={`flex-1 py-3 items-center justify-center rounded-lg ${status === "sold_out" ? "bg-card border border-border" : ""}`}
              >
                <Text
                  className={`text-body-md font-bold ${status === "sold_out" ? "text-error" : "text-muted-foreground"}`}
                >
                  Sold Out
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="mt-6 gap-3">
            <Button
              title={isEdit ? "Update Food Item" : "Publish Food Item"}
              size="lg"
              loading={loading}
              onPress={() => handleSubmit("active")}
              className="w-full"
            />
            <Pressable
              onPress={() => handleSubmit("draft")}
              className="w-full py-4 items-center rounded-full border border-border bg-card"
            >
              <Text className="text-body-lg font-bold text-muted-foreground">Save as Draft</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
