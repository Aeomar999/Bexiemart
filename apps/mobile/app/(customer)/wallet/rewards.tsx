import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Alert, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/lib/hooks/use-wallet";

const COIN_RATE = 0.01;

interface EarningMethod {
  id: string;
  title: string;
  coins: number;
  icon: string;
  completed: boolean;
  repeat?: string;
  route?: string;
}

const EARNING_METHODS: EarningMethod[] = [
  {
    id: "1",
    title: "Complete Profile",
    coins: 500,
    icon: "user-check",
    completed: true,
    route: "/(customer)/profile",
  },
  {
    id: "2",
    title: "First Top-Up",
    coins: 200,
    icon: "upload",
    completed: true,
    route: "/(customer)/wallet/topup",
  },
  {
    id: "3",
    title: "Make a Purchase",
    coins: 50,
    icon: "shopping-bag",
    completed: false,
    repeat: "Per order",
    route: "/(customer)/(shop)",
  },
  {
    id: "4",
    title: "Refer a Friend",
    coins: 1000,
    icon: "users",
    completed: false,
    repeat: "Per referral",
    route: "/(customer)/referrals",
  },
];

export default function RewardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: walletData } = useWallet();
  const bexieCoins = walletData?.bexieCoins ?? 0;

  const handleConvert = () => {
    const ghsValue = (bexieCoins * COIN_RATE).toFixed(2);
    Alert.alert("Convert Coins", `Convert ${bexieCoins} BexieCoins to GHS ${ghsValue}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Convert", onPress: () => Alert.alert("Success", "Coins converted successfully!") },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pb-4 bg-card border-b border-border"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-[20px] font-heading font-black text-foreground">BexieRewards</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-20">
        <View className="rounded-[32px] shadow-[0_20px_40px_rgba(217,119,6,0.2)] overflow-hidden mb-8">
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
            <Text className="text-[14px] font-heading font-bold text-white/90 uppercase tracking-wider mb-2">
              Your Balance
            </Text>
            <Text className="text-[48px] font-black text-white font-heading mb-1">
              {bexieCoins.toLocaleString()}
            </Text>
            <Text className="text-[15px] text-white/80 font-medium font-body mb-1">
              Gold Tier Member
            </Text>
            <Text className="text-[13px] text-white/60 font-body mb-6">100 coins = GHS 1.00</Text>

            <Button
              title={`Convert to GHS ${(bexieCoins * COIN_RATE).toFixed(2)}`}
              className="w-full bg-card rounded-full"
              textClassName="text-primary"
              onPress={handleConvert}
            />
          </LinearGradient>
        </View>

        <Text className="text-[18px] font-bold text-foreground font-heading mb-4 px-1">
          How to earn coins
        </Text>
        <View className="bg-card rounded-[24px] border border-border overflow-hidden mb-8 shadow-[0_10px_20px_rgba(0,0,0,0.02)]">
          {EARNING_METHODS.map((method, idx) => {
            const isLast = idx === EARNING_METHODS.length - 1;
            return (
              <View
                key={method.id}
                className={`flex-row items-center p-4 ${!isLast ? "border-b border-border" : ""}`}
              >
                <View className="w-12 h-12 rounded-full bg-amber-50 items-center justify-center mr-4">
                  <Icon name={method.icon} size={22} color="#d97706" />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-foreground">{method.title}</Text>
                  <View className="flex-row items-center mt-1">
                    <Icon name="plus-circle" size={14} color="#f59e0b" />
                    <Text className="text-[13px] font-bold text-amber-500 ml-1">
                      {method.coins} Coins
                    </Text>
                    {method.repeat && (
                      <Text className="text-[12px] text-muted-foreground ml-2">
                        ({method.repeat})
                      </Text>
                    )}
                  </View>
                </View>
                <View>
                  {method.completed ? (
                    <View className="px-3 py-1 bg-emerald-50 rounded-full flex-row items-center">
                      <Icon name="check" size={12} color="#059669" />
                      <Text className="text-[12px] font-bold text-emerald-600 ml-1">Done</Text>
                    </View>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      className="px-4 py-1.5 bg-muted rounded-full"
                      onPress={() => {
                        if (method.route) {
                          router.push(method.route as any);
                        }
                      }}
                    >
                      <Text className="text-[13px] font-bold text-muted-foreground">Go</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
