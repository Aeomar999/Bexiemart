import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export default function VendorContactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Ticket Submitted", "Our seller support team will contact you shortly.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    }, 1500);
  };

  return (
    <View className="flex-1 bg-background">
      <View 
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="mr-3" />
        <Text className="text-[20px] font-heading font-black text-foreground">
          Contact Support
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <Text className="text-[14px] text-muted-foreground leading-relaxed mb-6">
          Submit a ticket and our Seller Support team will investigate and respond to your registered email address.
        </Text>

        <View className="bg-card rounded-[20px] border border-border p-5 gap-4">
          <View>
            <Text className="text-[13px] font-bold text-muted-foreground mb-2 ml-1">Issue Category</Text>
            <Pressable className="bg-background border border-border rounded-[12px] p-4 flex-row justify-between items-center">
              <Text className="text-[15px] text-foreground">Payouts & Earnings</Text>
              <Icon name="chevron-down" size={20} color="#94a3b8" />
            </Pressable>
          </View>
          
          <Input 
            label="Order ID (Optional)"
            placeholder="e.g. ORD-9821"
          />

          <View>
            <Text className="text-[13px] font-bold text-muted-foreground mb-2 ml-1">Description</Text>
            <TextInput
              className="bg-background border border-border rounded-[16px] p-4 text-[15px] text-foreground h-32"
              placeholder="Describe your issue in detail..."
              multiline
              textAlignVertical="top"
            />
          </View>

          <Pressable className="border-2 border-dashed border-border rounded-[12px] p-4 items-center justify-center bg-background mt-2">
            <Icon name="paperclip" size={20} color="#64748b" style={{ marginBottom: 4 }} />
            <Text className="text-[13px] font-bold text-muted-foreground mt-1">Attach Screenshot</Text>
          </Pressable>
        </View>

        <Button
          title="Submit Ticket"
          size="lg"
          loading={loading}
          onPress={handleSubmit}
          className="w-full mt-6"
        />
      </ScrollView>
    </View>
  );
}
