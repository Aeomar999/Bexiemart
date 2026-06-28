import { BackButton } from "@/components/ui/BackButton";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { ListSkeleton } from "@/components/ui/Skeleton";
import {
  useBankAccounts,
  useMomoAccounts,
  useDeleteBankAccount,
  useDeleteMomoAccount,
} from "@/lib/hooks/use-wallet";
import { useState } from "react";

const MOMO_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  MTN: { bg: "#FFF8E1", border: "#FFC107", text: "#F57F17" },
  VODAFONE: { bg: "#FFEBEE", border: "#E60000", text: "#B71C1C" },
  AIRTELTIGO: { bg: "#E3F2FD", border: "#0073CF", text: "#01579B" },
};

export default function LinkAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"bank" | "momo">("bank");

  const { data: bankAccounts, isLoading: bankLoading } = useBankAccounts();
  const { data: momoAccounts, isLoading: momoLoading } = useMomoAccounts();
  const deleteBankAccount = useDeleteBankAccount();
  const deleteMomoAccount = useDeleteMomoAccount();

  const handleDeleteBank = (id: string, name: string) => {
    Alert.alert("Remove Account", `Remove ${name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteBankAccount.mutate(id) },
    ]);
  };

  const handleDeleteMomo = (id: string, phone: string) => {
    Alert.alert("Remove Account", `Remove ${phone}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteMomoAccount.mutate(id) },
    ]);
  };

  const bankList = bankAccounts ?? [];
  const momoList = momoAccounts ?? [];

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-display-sm font-heading font-black text-foreground">
            Link Account
          </Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View className="mx-5 mb-5 flex-row bg-gray-200 rounded-2xl p-1">
        <Pressable
          onPress={() => setActiveTab("bank")}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
            backgroundColor: activeTab === "bank" ? "#fff" : "transparent",
          }}
        >
          <View className="flex-row items-center">
            <Icon name="home" size={16} color={activeTab === "bank" ? "#2563EB" : "#6b7280"} />
            <Text
              style={{
                marginLeft: 8,
                fontWeight: "700",
                fontSize: 13,
                color: activeTab === "bank" ? "#2563EB" : "#6b7280",
              }}
            >
              Bank Account
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("momo")}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
            backgroundColor: activeTab === "momo" ? "#fff" : "transparent",
          }}
        >
          <View className="flex-row items-center">
            <Icon
              name="smartphone"
              size={16}
              color={activeTab === "momo" ? "#2563EB" : "#6b7280"}
            />
            <Text
              style={{
                marginLeft: 8,
                fontWeight: "700",
                fontSize: 13,
                color: activeTab === "momo" ? "#2563EB" : "#6b7280",
              }}
            >
              Mobile Money
            </Text>
          </View>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ─── BANK TAB ─── */}
        {activeTab === "bank" && (
          <View style={{ paddingHorizontal: 20 }}>
            {bankLoading ? (
              <View style={{ paddingVertical: 60, alignItems: "center" }}>
                <ListSkeleton />
              </View>
            ) : bankList.length > 0 ? (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    color: "#6b7280",
                    fontSize: 11,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 12,
                    marginLeft: 4,
                  }}
                >
                  Linked Accounts
                </Text>
                {bankList.map((account: any) => (
                  <View
                    key={account.id}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: "#f3f4f6",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 16,
                            backgroundColor: "#EFF6FF",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 16,
                          }}
                        >
                          <Icon name="home" size={22} color="#2563EB" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{ color: "#111827", fontWeight: "700", fontSize: 15 }}
                            numberOfLines={1}
                          >
                            {account.bankName}
                          </Text>
                          <Text
                            style={{
                              color: "#6b7280",
                              fontSize: 13,
                              fontFamily: "monospace",
                              marginTop: 2,
                            }}
                          >
                            {account.accountNumber}
                          </Text>
                          <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>
                            {account.accountName}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        {account.isVerified && (
                          <View
                            style={{
                              backgroundColor: "#F0FDF4",
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 999,
                            }}
                          >
                            <Text style={{ color: "#059669", fontSize: 10, fontWeight: "700" }}>
                              Verified
                            </Text>
                          </View>
                        )}
                        <Pressable
                          onPress={() => handleDeleteBank(account.id, account.bankName)}
                          style={{ padding: 8, borderRadius: 999, backgroundColor: "#FEF2F2" }}
                        >
                          <Icon name="trash-2" size={16} color="#EF4444" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: "#EFF6FF",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Icon name="home" size={36} color="#2563EB" />
                </View>
                <Text
                  style={{ color: "#111827", fontWeight: "700", fontSize: 18, marginBottom: 4 }}
                >
                  No Bank Accounts
                </Text>
                <Text
                  style={{
                    color: "#6b7280",
                    fontSize: 14,
                    textAlign: "center",
                    paddingHorizontal: 40,
                  }}
                >
                  Link your bank account to enable withdrawals and payments
                </Text>
              </View>
            )}

            <Pressable
              onPress={() => router.push("/(customer)/wallet/link-account/bank")}
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 16,
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: "#BFDBFE",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#DBEAFE",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Icon name="plus" size={20} color="#2563EB" />
                </View>
                <Text style={{ color: "#2563EB", fontWeight: "700", fontSize: 15 }}>
                  Add Bank Account
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* ─── MOMO TAB ─── */}
        {activeTab === "momo" && (
          <View style={{ paddingHorizontal: 20 }}>
            {momoLoading ? (
              <View style={{ paddingVertical: 60, alignItems: "center" }}>
                <ListSkeleton />
              </View>
            ) : momoList.length > 0 ? (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    color: "#6b7280",
                    fontSize: 11,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 12,
                    marginLeft: 4,
                  }}
                >
                  Linked Wallets
                </Text>
                {momoList.map((account: any) => {
                  const colors = MOMO_COLORS[account.provider] || MOMO_COLORS.MTN;
                  return (
                    <View
                      key={account.id}
                      style={{
                        backgroundColor: colors.bg,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1.5,
                        borderColor: colors.border,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                          <View
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 16,
                              backgroundColor: colors.border + "25",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 16,
                            }}
                          >
                            <Icon name="smartphone" size={22} color={colors.text} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
                              {account.provider} Mobile Money
                            </Text>
                            <Text
                              style={{
                                color: colors.text,
                                fontSize: 13,
                                fontFamily: "monospace",
                                marginTop: 2,
                                opacity: 0.7,
                              }}
                            >
                              {account.phoneNumber}
                            </Text>
                            <Text
                              style={{
                                color: colors.text,
                                fontSize: 12,
                                marginTop: 2,
                                opacity: 0.5,
                              }}
                            >
                              {account.accountName}
                            </Text>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => handleDeleteMomo(account.id, account.phoneNumber)}
                          style={{
                            padding: 8,
                            borderRadius: 999,
                            backgroundColor: colors.border + "20",
                          }}
                        >
                          <Icon name="trash-2" size={16} color={colors.text} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: "#FFFBEB",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Icon name="smartphone" size={36} color="#F59E0B" />
                </View>
                <Text
                  style={{ color: "#111827", fontWeight: "700", fontSize: 18, marginBottom: 4 }}
                >
                  No Mobile Money
                </Text>
                <Text
                  style={{
                    color: "#6b7280",
                    fontSize: 14,
                    textAlign: "center",
                    paddingHorizontal: 40,
                  }}
                >
                  Link your MTN, Vodafone, or AirtelTigo wallet for instant payments
                </Text>
              </View>
            )}

            <Pressable
              onPress={() => router.push("/(customer)/wallet/link-account/momo")}
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 16,
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: "#FDE68A",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#FEF3C7",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Icon name="plus" size={20} color="#F59E0B" />
                </View>
                <Text style={{ color: "#D97706", fontWeight: "700", fontSize: 15 }}>
                  Add Mobile Money
                </Text>
              </View>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
