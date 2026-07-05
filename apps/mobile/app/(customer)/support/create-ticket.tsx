import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui/BackButton";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { tokens } from "@/theme/tokens";
import { useOrders } from "@/lib/hooks/use-orders";
import { useCreateSupportTicket } from "@/lib/hooks/use-support";
import Toast from "@/lib/toast-polyfill";

const CATEGORIES = [
  {
    id: "ORDER_ISSUE",
    label: "Order Issue",
    icon: "package",
    desc: "Missing items, wrong order, late delivery",
  },
  {
    id: "PAYMENT_REFUND",
    label: "Payment & Refunds",
    icon: "credit-card",
    desc: "Failed transactions, refund status, charges",
  },
  {
    id: "DELIVERY",
    label: "Delivery Problem",
    icon: "truck",
    desc: "Rider issues, address change, tracking problem",
  },
  {
    id: "PRODUCT",
    label: "Product Quality",
    icon: "shopping-bag",
    desc: "Damaged goods, expired items, wrong specs",
  },
  {
    id: "ACCOUNT",
    label: "Account & Settings",
    icon: "user",
    desc: "Login issues, profile updates, verification",
  },
  {
    id: "OTHER",
    label: "Other Inquiry",
    icon: "help-circle",
    desc: "General questions, feedback, suggestions",
  },
] as const;

export default function CreateTicketScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ orderId?: string }>();

  const [step, setStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(params.orderId);
  const [subject, setSubject] = useState<string>("");
  const [content, setContent] = useState<string>("");

  const { data: orders, isLoading: isLoadingOrders } = useOrders();
  const createTicketMutation = useCreateSupportTicket();

  const handleNextStep = () => {
    if (step === 1 && !selectedCategory) {
      Toast.show({ type: "error", text1: "Please select a category" });
      return;
    }
    if (step === 3) {
      if (!subject.trim() || subject.trim().length < 3) {
        Toast.show({ type: "error", text1: "Please enter a brief subject (min 3 chars)" });
        return;
      }
      if (!content.trim() || content.trim().length < 5) {
        Toast.show({ type: "error", text1: "Please describe your issue in detail" });
        return;
      }
      handleSubmit();
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = () => {
    createTicketMutation.mutate(
      {
        category: selectedCategory,
        subject: subject.trim(),
        orderId: selectedOrderId,
        content: content.trim(),
      },
      {
        onSuccess: (ticket: any) => {
          Toast.show({
            type: "success",
            text1: "Ticket created",
            text2: "A support agent will connect with you soon",
          });
          if (ticket?.conversationId) {
            router.replace(`/(customer)/chats/${ticket.conversationId}`);
          } else {
            router.replace("/(customer)/support/tickets");
          }
        },
        onError: (err: any) => {
          Toast.show({
            type: "error",
            text1: "Failed to create ticket",
            text2: err.message || "Please try again later",
          });
        },
      }
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={handlePrevStep}
              className="p-2 -ml-2"
            >
              <Icon name="arrow-left" size={24} color="#0f172a" />
            </Pressable>
            <Text className="text-display-sm font-heading font-black text-foreground">
              Contact Support
            </Text>
          </View>
          <Text className="text-caption font-bold text-muted-foreground">Step {step} of 3</Text>
        </View>

        {/* Step progress bar */}
        <View className="flex-row gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        {/* STEP 1: Select Category */}
        {step === 1 && (
          <View className="gap-4">
            <Text className="text-heading-md font-bold text-foreground font-heading">
              What do you need help with?
            </Text>
            <Text className="text-body-md text-muted-foreground font-body -mt-2 mb-2">
              Select the category that best describes your inquiry.
            </Text>

            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  className={`p-4 rounded-2xl border flex-row items-center gap-4 ${
                    isSelected ? "bg-primary-subtle border-primary" : "bg-card border-border"
                  }`}
                >
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center ${
                      isSelected ? "bg-primary" : "bg-secondary"
                    }`}
                  >
                    <Icon
                      name={cat.icon}
                      size={22}
                      color={isSelected ? "#ffffff" : tokens.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`font-heading font-bold text-heading-sm ${isSelected ? "text-primary" : "text-foreground"}`}
                    >
                      {cat.label}
                    </Text>
                    <Text className="text-body-sm text-muted-foreground font-body mt-0.5">
                      {cat.desc}
                    </Text>
                  </View>
                  <View
                    className={`w-6 h-6 rounded-full border items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-muted"}`}
                  >
                    {isSelected && <Icon name="check" size={14} color="#ffffff" />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* STEP 2: Link Order (Optional) */}
        {step === 2 && (
          <View className="gap-4">
            <Text className="text-heading-md font-bold text-foreground font-heading">
              Is this related to an order? (Optional)
            </Text>
            <Text className="text-body-md text-muted-foreground font-body -mt-2 mb-2">
              Linking an order helps our agents resolve your issue faster.
            </Text>

            <Pressable
              onPress={() => setSelectedOrderId(undefined)}
              className={`p-4 rounded-2xl border flex-row items-center justify-between ${
                !selectedOrderId ? "bg-primary-subtle border-primary" : "bg-card border-border"
              }`}
            >
              <Text
                className={`font-heading font-bold text-body-lg ${!selectedOrderId ? "text-primary" : "text-foreground"}`}
              >
                Not related to a specific order
              </Text>
              <View
                className={`w-6 h-6 rounded-full border items-center justify-center ${!selectedOrderId ? "border-primary bg-primary" : "border-muted"}`}
              >
                {!selectedOrderId && <Icon name="check" size={14} color="#ffffff" />}
              </View>
            </Pressable>

            {isLoadingOrders ? (
              <View className="py-10 items-center justify-center">
                <ActivityIndicator size="large" color={tokens.primary} />
                <Text className="text-muted-foreground text-body-sm mt-2">
                  Loading recent orders...
                </Text>
              </View>
            ) : orders && orders.length > 0 ? (
              orders.map((order: any) => {
                const isSelected = selectedOrderId === order.id;
                return (
                  <Pressable
                    key={order.id}
                    onPress={() => setSelectedOrderId(order.id)}
                    className={`p-4 rounded-2xl border flex-row items-center justify-between ${
                      isSelected ? "bg-primary-subtle border-primary" : "bg-card border-border"
                    }`}
                  >
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center gap-2">
                        <Text className="font-heading font-bold text-body-lg text-foreground">
                          Order #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                        </Text>
                        <View className="bg-secondary px-2 py-0.5 rounded-full">
                          <Text className="text-caption font-bold text-muted-foreground uppercase">
                            {order.status}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-body-sm text-muted-foreground mt-1">
                        Total: ₵{Number(order.total || 0).toFixed(2)} •{" "}
                        {new Date(order.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View
                      className={`w-6 h-6 rounded-full border items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-muted"}`}
                    >
                      {isSelected && <Icon name="check" size={14} color="#ffffff" />}
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <View className="p-6 bg-card rounded-2xl border border-border items-center justify-center">
                <Icon name="package" size={32} color="#94a3b8" />
                <Text className="text-foreground font-bold text-body-md mt-2">
                  No recent orders found
                </Text>
              </View>
            )}
          </View>
        )}

        {/* STEP 3: Describe Issue */}
        {step === 3 && (
          <View className="gap-5">
            <View>
              <Text className="text-heading-md font-bold text-foreground font-heading mb-1">
                Tell us what happened
              </Text>
              <Text className="text-body-md text-muted-foreground font-body">
                Provide as much detail as possible so our support team can assist you effectively.
              </Text>
            </View>

            <View className="gap-2">
              <Text className="text-body-sm font-bold text-foreground uppercase tracking-wider">
                Subject <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="e.g. Missing drink from my order"
                placeholderTextColor="#94a3b8"
                className="bg-card px-4 py-3.5 rounded-xl border border-border text-foreground font-body text-body-md"
              />
            </View>

            <View className="gap-2">
              <Text className="text-body-sm font-bold text-foreground uppercase tracking-wider">
                Message <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Describe your issue in detail here..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="bg-card p-4 rounded-xl border border-border text-foreground font-body text-body-md min-h-[140px]"
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer / Actions */}
      <View
        className="px-5 py-4 bg-card border-t border-border flex-row gap-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {step > 1 && (
          <Button
            variant="outline"
            label="Back"
            onPress={handlePrevStep}
            className="flex-1"
            disabled={createTicketMutation.isPending}
          />
        )}
        <Button
          variant="primary"
          label={
            step === 3
              ? createTicketMutation.isPending
                ? "Submitting..."
                : "Submit Ticket"
              : "Continue"
          }
          onPress={handleNextStep}
          className="flex-1"
          isLoading={createTicketMutation.isPending}
        />
      </View>
    </View>
  );
}
