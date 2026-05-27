import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useState } from "react";

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [toggles, setToggles] = useState({
    newOrder: true,
    orderCancel: true,
    payout: true,
    chat: true,
    promo: false,
    email: true,
    sms: false
  });

  const toggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View className="flex-1 bg-background">
      <View 
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="mr-3" />
        <Text className="text-[20px] font-heading font-black text-foreground">
          Notifications
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <Text className="text-[16px] font-bold text-foreground mb-3 ml-1">Push Notifications</Text>
        <View className="bg-card rounded-[24px] border border-border overflow-hidden mb-6">
          <View className="p-4 border-b border-border flex-row justify-between items-center">
            <View>
              <Text className="text-[15px] font-bold text-foreground">New Orders</Text>
              <Text className="text-[12px] text-muted-foreground mt-0.5">Alerts when a customer places an order</Text>
            </View>
            <Switch value={toggles.newOrder} onValueChange={() => toggle('newOrder')} trackColor={{ true: '#004CFF' }} />
          </View>
          <View className="p-4 border-b border-border flex-row justify-between items-center">
            <View>
              <Text className="text-[15px] font-bold text-foreground">Order Cancellations</Text>
              <Text className="text-[12px] text-muted-foreground mt-0.5">Alerts when an order is cancelled</Text>
            </View>
            <Switch value={toggles.orderCancel} onValueChange={() => toggle('orderCancel')} trackColor={{ true: '#004CFF' }} />
          </View>
          <View className="p-4 border-b border-border flex-row justify-between items-center">
            <View>
              <Text className="text-[15px] font-bold text-foreground">Payouts</Text>
              <Text className="text-[12px] text-muted-foreground mt-0.5">Alerts for successful withdrawals</Text>
            </View>
            <Switch value={toggles.payout} onValueChange={() => toggle('payout')} trackColor={{ true: '#004CFF' }} />
          </View>
          <View className="p-4 border-b border-border flex-row justify-between items-center">
            <View>
              <Text className="text-[15px] font-bold text-foreground">Customer Messages</Text>
              <Text className="text-[12px] text-muted-foreground mt-0.5">Alerts for new inbox messages</Text>
            </View>
            <Switch value={toggles.chat} onValueChange={() => toggle('chat')} trackColor={{ true: '#004CFF' }} />
          </View>
          <View className="p-4 flex-row justify-between items-center">
            <View>
              <Text className="text-[15px] font-bold text-foreground">Promotions</Text>
              <Text className="text-[12px] text-muted-foreground mt-0.5">BexieMart seller tips and promos</Text>
            </View>
            <Switch value={toggles.promo} onValueChange={() => toggle('promo')} trackColor={{ true: '#004CFF' }} />
          </View>
        </View>

        <Text className="text-[16px] font-bold text-foreground mb-3 ml-1">Other Channels</Text>
        <View className="bg-card rounded-[24px] border border-border overflow-hidden mb-6">
          <View className="p-4 border-b border-border flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Icon name="mail" size={20} color="#64748b" style={{ marginRight: 12 }} />
              <Text className="text-[15px] font-bold text-foreground">Email Summaries</Text>
            </View>
            <Switch value={toggles.email} onValueChange={() => toggle('email')} trackColor={{ true: '#004CFF' }} />
          </View>
          <View className="p-4 flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Icon name="smartphone" size={20} color="#64748b" style={{ marginRight: 12 }} />
              <Text className="text-[15px] font-bold text-foreground">SMS Alerts</Text>
            </View>
            <Switch value={toggles.sms} onValueChange={() => toggle('sms')} trackColor={{ true: '#004CFF' }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
