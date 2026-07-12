import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui/BackButton";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { tokens } from "@/theme/tokens";
import { useCreateSupportTicket } from "@/lib/hooks/use-support";

export default function DispatcherHelpScreen() {
  const insets = useSafeAreaInsets();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const createTicketMutation = useCreateSupportTicket();

  const faqs = [
    {
      q: "How do I accept a delivery job?",
      a: "You can accept available jobs from your Home tab whenever your status is online.",
    },
    {
      q: "How are delivery earnings calculated?",
      a: "Earnings are calculated based on the base delivery fee plus distance traveled and applicable bonuses.",
    },
    {
      q: "What if a customer is unreachable?",
      a: "Use the Call Customer button on the active delivery job. If unreachable after 10 minutes, submit a support ticket.",
    },
    {
      q: "When are earnings paid out?",
      a: "Earnings accumulate in your wallet and can be withdrawn directly to your mobile money account.",
    },
  ];

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter both a subject and message for your support ticket."
      );
      return;
    }

    createTicketMutation.mutate(
      {
        subject: subject.trim(),
        message: message.trim(),
        category: "DELIVERY",
      },
      {
        onSuccess: () => {
          Alert.alert(
            "Ticket Submitted",
            "Our support team has received your inquiry and will respond soon."
          );
          setSubject("");
          setMessage("");
          setShowSupportForm(false);
        },
        onError: (error: any) => {
          Alert.alert(
            "Submission Failed",
            error?.message || "Failed to create support ticket. Please try again."
          );
        },
      }
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-display-sm font-heading font-black text-foreground">
            Help & Support
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="px-5 pt-4 gap-4 pb-12">
          {/* Contact Support Banner */}
          <Pressable
            onPress={() => setShowSupportForm((prev) => !prev)}
            className="bg-primary-subtle p-5 rounded-2xl border border-primary/20 flex-row items-center justify-between"
          >
            <View className="flex-1 pr-3">
              <View className="flex-row items-center gap-2 mb-1">
                <Icon name="message-square" size={20} color={tokens.primary} />
                <Text className="text-heading-sm font-bold text-primary font-heading">
                  Contact Support
                </Text>
              </View>
              <Text className="text-body-sm text-muted-foreground font-body">
                Need dispatcher assistance? File a ticket directly with our operations team.
              </Text>
            </View>
            <View className="bg-primary px-3.5 py-2 rounded-xl flex-row items-center gap-1">
              <Text className="text-caption font-bold text-white">
                {showSupportForm ? "Hide" : "Open"}
              </Text>
            </View>
          </Pressable>

          {showSupportForm && (
            <View className="bg-card p-5 rounded-2xl border border-border gap-4">
              <Text className="text-heading-sm font-bold text-foreground font-heading">
                Submit Support Ticket
              </Text>

              <View>
                <Text className="text-body-sm font-bold text-foreground mb-1.5">Subject</Text>
                <TextInput
                  placeholder="e.g. Issue with order delivery"
                  value={subject}
                  onChangeText={setSubject}
                  className="bg-background border border-border rounded-xl px-4 py-3 text-body-md text-foreground"
                />
              </View>

              <View>
                <Text className="text-body-sm font-bold text-foreground mb-1.5">Message</Text>
                <TextInput
                  placeholder="Describe your issue in detail..."
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="bg-background border border-border rounded-xl px-4 py-3 text-body-md text-foreground h-28"
                />
              </View>

              <Button
                title={createTicketMutation.isPending ? "Submitting..." : "Submit Ticket"}
                onPress={handleSubmitTicket}
                disabled={createTicketMutation.isPending}
              />
            </View>
          )}

          <Text className="text-heading-sm font-bold text-foreground font-heading mt-2">
            Frequently Asked Questions
          </Text>

          {faqs.map((faq, i) => {
            const isExpanded = expandedIndex === i;
            return (
              <Pressable
                key={i}
                className={`bg-card p-5 rounded-2xl border ${isExpanded ? "border-border shadow-sm" : "border-border"}`}
                onPress={() => setExpandedIndex(isExpanded ? null : i)}
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-heading-sm font-bold text-foreground font-heading flex-1 pr-4">
                    {faq.q}
                  </Text>
                  <Icon
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={isExpanded ? tokens.primary : "#64748b"}
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
