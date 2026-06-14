import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Share, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import Toast from "@/lib/toast-polyfill";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import {
  useReferralProfile,
  useReferralStats,
  useGenerateReferralCode,
} from "@/lib/hooks/use-referrals";
import { useState } from "react";

export default function ReferralsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading } = useReferralProfile();
  const { data: stats } = useReferralStats();
  const generateCode = useGenerateReferralCode();
  const [isGenerating, setIsGenerating] = useState(false);

  const referralCode = profile?.code;
  const referredCount = stats?.totalReferrals ?? 0;
  const rewardsEarned = stats?.totalRewards ?? 0;

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      await generateCode.mutateAsync();
      Toast.show({
        type: "success",
        text1: "Code Generated",
        text2: "Your referral code is ready!",
      });
    } catch {
      Toast.show({ type: "error", text1: "Error", text2: "Could not generate referral code." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join Bexiemart and get 50 BexieCoins! Use my referral code: ${referralCode} when signing up.`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-[20px] font-heading font-black text-foreground">Refer & Earn</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        {/* Banner */}
        <View className="bg-amber-100 rounded-[32px] p-8 items-center border border-amber-200 mb-6 shadow-sm relative overflow-hidden">
          <View className="absolute top-[-20px] right-[-20px] opacity-10">
            <Icon name="gift" size={120} color="#d97706" />
          </View>
          <View className="w-20 h-20 bg-amber-500 rounded-full items-center justify-center mb-4 border-4 border-card shadow-lg">
            <Icon name="gift" size={36} color="#fff" />
          </View>
          <Text className="text-[24px] font-heading font-black text-amber-900 text-center mb-2">
            Get 50 BexieCoins
          </Text>
          <Text className="text-body-md text-amber-700 font-medium text-center">
            For every friend who signs up and makes their first purchase!
          </Text>
        </View>

        {/* Code Sharing */}
        <View className="bg-card rounded-[24px] p-5 border border-border shadow-sm mb-6">
          <Text className="text-body-md font-bold text-foreground font-heading mb-4">
            Your Referral Code
          </Text>
          {isLoading ? (
            <ActivityIndicator size="small" color="var(--color-primary)" />
          ) : referralCode ? (
            <View className="flex-row items-center gap-3">
              <View className="flex-1 bg-background rounded-[16px] border border-border py-4 items-center justify-center border-dashed">
                <Text className="text-[20px] font-mono font-bold text-primary tracking-wider">
                  {referralCode}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="w-14 h-14 bg-primary-subtle rounded-[16px] items-center justify-center border border-border"
                onPress={async () => {
                  await Clipboard.setStringAsync(referralCode);
                  Toast.show({
                    type: "success",
                    text1: "Copied!",
                    text2: "Referral code copied to clipboard.",
                  });
                }}
              >
                <Icon name="copy" size={24} color="var(--color-primary)" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              className="bg-primary rounded-[16px] py-4 items-center"
              onPress={handleGenerateCode}
              disabled={isGenerating}
            >
              <Text className="text-white font-bold text-[16px]">
                {isGenerating ? "Generating..." : "Generate Referral Code"}
              </Text>
            </Pressable>
          )}

          <Button
            title={referralCode ? "Share via WhatsApp" : "Generate Code First"}
            size="lg"
            className="w-full mt-4 rounded-full bg-[#25D366]"
            onPress={referralCode ? handleShare : handleGenerateCode}
            disabled={!referralCode && isGenerating}
          />
        </View>

        {/* Stats */}
        <Text className="text-[18px] font-heading font-bold text-foreground mb-4">Your Stats</Text>
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1 bg-card p-5 rounded-[24px] border border-border items-center">
            <Icon name="users" size={24} color="#64748b" />
            <Text className="text-[24px] font-heading font-black text-foreground mt-2">
              {referredCount}
            </Text>
            <Text className="text-caption font-body text-muted-foreground mt-1">
              Friends Joined
            </Text>
          </View>
          <View className="flex-1 bg-card p-5 rounded-[24px] border border-border items-center">
            <Icon name="award" size={24} color="#f59e0b" />
            <Text className="text-[24px] font-heading font-black text-amber-500 mt-2">
              {rewardsEarned}
            </Text>
            <Text className="text-caption font-body text-muted-foreground mt-1">Coins Earned</Text>
          </View>
        </View>

        {/* How it works */}
        <View className="bg-muted rounded-[24px] p-6 mb-10">
          <Text className="text-body-md font-bold text-foreground font-heading mb-4">
            How it works
          </Text>

          <View className="flex-row items-start gap-4 mb-4">
            <View className="w-8 h-8 rounded-full bg-secondary items-center justify-center">
              <Text className="font-bold text-muted-foreground">1</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-foreground font-body">Share your code</Text>
              <Text className="text-body-sm text-muted-foreground mt-1">
                Send your unique code to friends.
              </Text>
            </View>
          </View>

          <View className="flex-row items-start gap-4 mb-4">
            <View className="w-8 h-8 rounded-full bg-secondary items-center justify-center">
              <Text className="font-bold text-muted-foreground">2</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-foreground font-body">Friend signs up</Text>
              <Text className="text-body-sm text-muted-foreground mt-1">
                They enter your code during registration.
              </Text>
            </View>
          </View>

          <View className="flex-row items-start gap-4">
            <View className="w-8 h-8 rounded-full bg-secondary items-center justify-center">
              <Text className="font-bold text-muted-foreground">3</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-foreground font-body">You both get rewarded</Text>
              <Text className="text-body-sm text-muted-foreground mt-1">
                Once they make a purchase, you both receive 50 BexieCoins!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
