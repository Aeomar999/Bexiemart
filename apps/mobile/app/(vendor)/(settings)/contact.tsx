import { BackButton } from "@/components/ui/BackButton";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { useCreateSupportTicket } from "@/lib/hooks/use-support";
import { SUPPORT_CATEGORIES } from "@/lib/api/support";

export default function VendorContactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createTicket = useCreateSupportTicket();

  const [category, setCategory] = useState<string>("PAYMENT_REFUND");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [orderId, setOrderId] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const selectedCategoryLabel =
    SUPPORT_CATEGORIES.find((c) => c.value === category)?.label || "Other";

  const handleSubmit = async () => {
    if (subject.trim().length < 3) {
      Alert.alert("Add a subject", "Please enter a short subject (3+ characters).");
      return;
    }

    try {
      await createTicket.mutateAsync({
        category,
        subject: subject.trim(),
        content: description.trim() || undefined,
        orderId: orderId.trim() || undefined,
      });
      Alert.alert(
        "Ticket Submitted",
        "Our seller support team will investigate and respond via your registered email.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert(
        "Couldn't submit",
        e?.response?.data?.message || e?.message || "Please try again."
      );
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="mr-3" />
        <Text className="text-display-sm font-heading font-black text-foreground">
          Contact Support
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <Text className="text-body-md text-muted-foreground leading-relaxed mb-6">
          Submit a ticket and our Seller Support team will investigate and respond to your
          registered email address.
        </Text>

        <View className="bg-card rounded-2xl border border-border p-5 gap-4">
          <View>
            <Text className="text-sm font-bold text-muted-foreground mb-2 ml-1">
              Issue Category
            </Text>
            <Pressable
              className="bg-background border border-border rounded-lg p-4 flex-row justify-between items-center"
              onPress={() => setShowPicker(true)}
              testID="category-picker-button"
            >
              <Text className="text-body-lg text-foreground">{selectedCategoryLabel}</Text>
              <Icon name="chevron-down" size={20} color="#94a3b8" />
            </Pressable>
          </View>

          <Input
            label="Subject (Required)"
            placeholder="e.g. Delayed payout settlement"
            value={subject}
            onChangeText={setSubject}
            testID="subject-input"
          />

          <Input
            label="Order ID (Optional)"
            placeholder="e.g. ORD-9821"
            value={orderId}
            onChangeText={setOrderId}
            testID="order-id-input"
          />

          <View>
            <Text className="text-sm font-bold text-muted-foreground mb-2 ml-1">Description</Text>
            <TextInput
              className="bg-background border border-border rounded-xl p-4 text-body-lg text-foreground h-32"
              placeholder="Describe your issue in detail..."
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
              testID="description-input"
            />
          </View>
        </View>

        <Button
          title="Submit Ticket"
          size="lg"
          loading={createTicket.isPending}
          onPress={handleSubmit}
          className="w-full mt-6"
          testID="submit-ticket-button"
        />
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal
        visible={showPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setShowPicker(false)} />
          <View className="bg-card rounded-t-3xl p-6 pb-12">
            <View className="w-12 h-1.5 bg-secondary rounded-full self-center mb-6" />

            <Text className="text-display-sm font-heading font-bold text-foreground mb-4 text-center">
              Select Category
            </Text>

            <View className="gap-2">
              {SUPPORT_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  className={`w-full py-4 px-5 rounded-xl border flex-row items-center justify-between ${
                    category === cat.value
                      ? "bg-primary/10 border-primary"
                      : "bg-muted/30 border-border"
                  }`}
                  onPress={() => {
                    setCategory(cat.value);
                    setShowPicker(false);
                  }}
                  testID={`category-option-${cat.value}`}
                >
                  <Text
                    className={`text-body-lg font-bold ${
                      category === cat.value ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {cat.label}
                  </Text>
                  {category === cat.value && <Icon name="check" size={20} color="#0ea5e9" />}
                </Pressable>
              ))}
            </View>

            <Pressable
              className="w-full py-4 rounded-full bg-muted items-center justify-center mt-4"
              onPress={() => setShowPicker(false)}
            >
              <Text className="text-body-lg font-bold text-muted-foreground">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
