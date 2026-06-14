import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export default function TwoFactorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="mr-3" />
        <Text className="text-[20px] font-heading font-black text-foreground">Two-Factor Auth</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <View className="items-center mb-8 mt-4">
          <View
            className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${is2FAEnabled ? "bg-green-100" : "bg-secondary"}`}
          >
            <Icon name="shield" size={40} color={is2FAEnabled ? "#10b981" : "#94a3b8"} />
          </View>
          <Text className="text-[20px] font-heading font-black text-foreground mb-2">
            {is2FAEnabled ? "2FA is Active" : "2FA is Disabled"}
          </Text>
          <Text className="text-[14px] text-muted-foreground text-center px-4 leading-relaxed">
            Two-factor authentication adds an extra layer of security to your account by requiring
            more than just a password to log in.
          </Text>
        </View>

        <View className="bg-card rounded-[24px] border border-border overflow-hidden mb-6 p-5">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-muted items-center justify-center mr-3">
                <Icon name="smartphone" size={20} color="#64748b" />
              </View>
              <View className="flex-1 pr-4">
                <Text className="text-[15px] font-bold text-foreground">Authenticator App</Text>
                <Text className="text-[12px] text-muted-foreground mt-0.5">
                  Use an app like Google Authenticator or Authy.
                </Text>
              </View>
            </View>
            <Switch
              value={is2FAEnabled}
              onValueChange={setIs2FAEnabled}
              trackColor={{ true: "#10b981" }}
            />
          </View>
        </View>

        {is2FAEnabled && (
          <>
            <Text className="text-[16px] font-bold text-foreground mb-3 ml-1">Backup Methods</Text>
            <View className="bg-card rounded-[24px] border border-border overflow-hidden mb-6">
              <Pressable className="p-5 border-b border-border flex-row justify-between items-center">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-muted items-center justify-center mr-3">
                    <Icon name="message-square" size={20} color="#64748b" />
                  </View>
                  <View className="flex-1 pr-4">
                    <Text className="text-[15px] font-bold text-foreground">SMS Recovery</Text>
                    <Text className="text-[12px] text-muted-foreground mt-0.5">
                      Receive codes via +233 ** *** *492
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color="#cbd5e1" />
              </Pressable>

              <Pressable className="p-5 flex-row justify-between items-center">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-muted items-center justify-center mr-3">
                    <Icon name="file-text" size={20} color="#64748b" />
                  </View>
                  <View className="flex-1 pr-4">
                    <Text className="text-[15px] font-bold text-foreground">Recovery Codes</Text>
                    <Text className="text-[12px] text-muted-foreground mt-0.5">
                      10 codes remaining
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color="#cbd5e1" />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
