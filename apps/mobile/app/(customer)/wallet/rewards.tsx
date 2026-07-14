import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Alert, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useCoinsSummary, useConvertCoins } from "@/lib/hooks/use-wallet";

const COIN_RATE = 0.01;

export default function RewardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: summary, isLoading } = useCoinsSummary();
  const convertCoins = useConvertCoins();

  const balance = summary?.balance ?? 0;
  const convertibleCoins = Math.floor(balance / 100) * 100;
  const canConvert = convertibleCoins >= 100 && !convertCoins.isPending;

  const handleConvert = () => {
    if (!canConvert) return;
    const ghsValue = (convertibleCoins * COIN_RATE).toFixed(2);
    Alert.alert("Convert Coins", `Convert ${convertibleCoins} BexieCoins to GHS ${ghsValue}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Convert",
        onPress: () => {
          convertCoins.mutate(convertibleCoins, {
            onSuccess: () => {
              Alert.alert("Success", "Coins converted successfully!");
            },
            onError: (err: any) => {
              Alert.alert("Error", err?.response?.data?.message ?? "Failed to convert coins");
            },
          });
        },
      },
    ]);
  };

  const earnState = summary?.earn ?? {
    completeProfile: false,
    firstTopup: false,
    orders: 0,
    referrals: 0,
  };

  const earningMethods = [
    {
      id: "1",
      title: "Complete Profile",
      coins: 500,
      icon: "user-check",
      completed: earnState.completeProfile,
      statusText: earnState.completeProfile ? "Done" : "Pending",
      route: "/(customer)/profile",
    },
    {
      id: "2",
      title: "First Top-Up",
      coins: 200,
      icon: "upload",
      completed: earnState.firstTopup,
      statusText: earnState.firstTopup ? "Done" : "Pending",
      route: "/(customer)/wallet/topup",
    },
    {
      id: "3",
      title: "Make a Purchase",
      coins: 50,
      icon: "shopping-bag",
      completed: earnState.orders > 0,
      statusText: `${earnState.orders} completed`,
      repeat: "Per order",
      route: "/(customer)/(shop)",
    },
    {
      id: "4",
      title: "Refer a Friend",
      coins: 1000,
      icon: "users",
      completed: earnState.referrals > 0,
      statusText: `${earnState.referrals} referred`,
      repeat: "Per referral",
      route: "/(customer)/referrals",
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pb-4 bg-card border-b border-border"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-display-sm font-heading font-black text-foreground">
            BexieRewards
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#d97706" testID="rewards-loading" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-5 pt-6 pb-20">
          <View className="rounded-3xl shadow-[0_20px_40px_rgba(217,119,6,0.2)] overflow-hidden mb-8">
            <LinearGradient
              colors={["#f59e0b", "#d97706"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ padding: 24, position: "relative", alignItems: "center" }}
            >
              <View className="absolute right-[-20px] top-[-20px] opacity-10">
                <Icon name="award" size={160} color="#fff" />
              </View>
              <View className="w-16 h-16 rounded-full bg-card/20 items-center justify-center mb-4">
                <Icon name="star" size={32} color="#fff" />
              </View>
              <Text className="text-body-md font-heading font-bold text-white/90 uppercase tracking-wider mb-2">
                Your Balance
              </Text>
              <Text
                className="text-[48px] font-black text-white font-heading mb-1"
                testID="coins-balance"
              >
                {balance.toLocaleString()}
              </Text>
              <Text className="text-body-lg text-white/80 font-medium font-body mb-1">
                Gold Tier Member
              </Text>
              <Text className="text-sm text-white/60 font-body mb-6">100 coins = GHS 1.00</Text>

              <Button
                title={
                  convertCoins.isPending
                    ? "Converting..."
                    : canConvert
                      ? `Redeem ${convertibleCoins} Coins (GHS ${(convertibleCoins * COIN_RATE).toFixed(2)})`
                      : "Minimum 100 Coins to Redeem"
                }
                disabled={!canConvert}
                className={`w-full rounded-full ${canConvert ? "bg-card" : "bg-card/40 opacity-70"}`}
                textClassName={
                  canConvert ? "text-primary font-bold" : "text-muted-foreground font-bold"
                }
                onPress={handleConvert}
                testID="redeem-button"
              />
            </LinearGradient>
          </View>

          <Text className="text-heading-md font-bold text-foreground font-heading mb-4 px-1">
            How to earn coins
          </Text>
          <View className="bg-card rounded-2xl border border-border overflow-hidden mb-8 shadow-lg">
            {earningMethods.map((method, idx) => {
              const isLast = idx === earningMethods.length - 1;
              return (
                <View
                  key={method.id}
                  className={`flex-row items-center p-4 ${!isLast ? "border-b border-border" : ""}`}
                >
                  <View className="w-12 h-12 rounded-full bg-amber-50 items-center justify-center mr-4">
                    <Icon name={method.icon} size={22} color="#d97706" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-body-lg font-bold text-foreground">{method.title}</Text>
                    <View className="flex-row items-center mt-1">
                      <Icon name="plus-circle" size={14} color="#f59e0b" />
                      <Text className="text-sm font-bold text-amber-500 ml-1">
                        {method.coins} Coins
                      </Text>
                      {method.repeat && (
                        <Text className="text-body-sm text-muted-foreground ml-2">
                          ({method.repeat})
                        </Text>
                      )}
                    </View>
                  </View>
                  <View className="items-end">
                    <View
                      className={`px-3 py-1 rounded-full flex-row items-center ${
                        method.completed ? "bg-emerald-50" : "bg-amber-50"
                      }`}
                    >
                      {method.completed && <Icon name="check" size={12} color="#059669" />}
                      <Text
                        className={`text-body-sm font-bold ml-1 ${
                          method.completed ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {method.statusText}
                      </Text>
                    </View>
                    {!method.completed && method.route && (
                      <Pressable
                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                        className="mt-1 px-3 py-1 bg-muted rounded-full"
                        onPress={() => router.push(method.route as any)}
                      >
                        <Text className="text-xs font-bold text-muted-foreground">Go</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
