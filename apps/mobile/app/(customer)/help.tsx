import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";

export default function HelpCenterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const faqs = [
    {
      q: "How do I track my order?",
      a: "You can track your order in the 'Order History' section.",
    },
    {
      q: "What is your return policy?",
      a: "We accept returns within 7 days of delivery for unused items.",
    },
    {
      q: "How do I use BexieCoins?",
      a: "You can apply BexieCoins during checkout for a discount.",
    },
  ];

  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-[20px] font-heading font-black text-foreground">Help Center</Text>
        </View>
      </View>
      <ScrollView className="flex-1">
        <View className="px-5 gap-4 pb-12">
          {faqs.map((faq, i) => {
            const isExpanded = expandedIndex === i;
            return (
              <Pressable
                key={i}
                className={`bg-card p-5 rounded-[24px] border ${isExpanded ? "border-brand-200 shadow-sm" : "border-border"}`}
                onPress={() => setExpandedIndex(isExpanded ? null : i)}
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-heading-sm font-bold text-foreground font-heading flex-1 pr-4">
                    {faq.q}
                  </Text>
                  <Icon
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={isExpanded ? "#004CFF" : "#64748b"}
                  />
                </View>
                {isExpanded && (
                  <View className="mt-3 pt-3 border-t border-border">
                    <Text className="text-body-md text-muted-foreground font-body leading-relaxed">
                      {faq.a}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
