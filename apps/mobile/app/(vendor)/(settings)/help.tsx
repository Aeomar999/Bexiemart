import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";

const FAQS = [
  {
    q: "How and when do I get paid?",
    a: "You can request a withdrawal to your Mobile Money or Bank Account at any time from the Earnings tab. Transfers typically take 1-2 hours to process.",
  },
  {
    q: "How do I manage my delivery options?",
    a: "When an order is ready, you can choose to request a BexieMart rider or handle the delivery yourself. Set your default preference in Settings.",
  },
  {
    q: "What is the platform fee?",
    a: "BexieMart charges a flat 5% commission on successful sales, plus a GHS 5.00 flat fee for withdrawals.",
  },
];

export default function VendorHelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="mr-3" />
        <Text className="text-[20px] font-heading font-black text-foreground">
          Seller Help Center
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Input
            placeholder="Search articles..."
            leftIcon={<Icon name="search" size={20} color="#94a3b8" />}
          />
        </View>

        <Text className="text-[18px] font-bold text-foreground mb-4">
          Frequently Asked Questions
        </Text>
        <View className="gap-3 mb-8">
          {FAQS.map((faq, idx) => (
            <View key={idx} className="bg-card rounded-[16px] border border-border p-4">
              <Text className="text-[15px] font-bold text-foreground mb-2">{faq.q}</Text>
              <Text className="text-[14px] text-muted-foreground leading-relaxed">{faq.a}</Text>
            </View>
          ))}
        </View>

        <View className="bg-brand-50 border border-brand-100 rounded-[24px] p-6 items-center">
          <View className="w-16 h-16 rounded-full bg-brand-100 items-center justify-center mb-4">
            <Icon name="life-buoy" size={24} color="#004CFF" />
          </View>
          <Text className="text-[18px] font-bold text-foreground mb-2">Need more help?</Text>
          <Text className="text-[14px] text-muted-foreground text-center mb-6">
            Our dedicated seller support team is here to assist you 24/7.
          </Text>
          <Pressable
            className="bg-brand-600 w-full py-4 rounded-full items-center"
            onPress={() => router.push("/(vendor)/(settings)/contact")}
          >
            <Text className="text-white font-bold text-[15px]">Contact Support</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
