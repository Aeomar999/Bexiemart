import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, Switch, Modal } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";

export default function SecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedDevice, setSelectedDevice] = useState<any>(null);

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="mr-3" />
        <Text className="text-[20px] font-heading font-black text-foreground">Security</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <View className="bg-card rounded-[24px] border border-border overflow-hidden mb-6">
          <Pressable
            className="p-4 border-b border-border flex-row justify-between items-center"
            style={({ pressed }) => [{ backgroundColor: pressed ? "#f8fafc" : "white" }]}
            onPress={() => router.push("/(vendor)/(settings)/change-password")}
          >
            <View>
              <Text className="text-[15px] font-bold text-foreground">Change Password</Text>
              <Text className="text-[12px] text-muted-foreground mt-0.5">
                Last changed 3 months ago
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color="#cbd5e1" />
          </Pressable>
          <Pressable
            className="p-4 flex-row justify-between items-center"
            style={({ pressed }) => [{ backgroundColor: pressed ? "#f8fafc" : "white" }]}
            onPress={() => router.push("/(vendor)/(settings)/change-pin")}
          >
            <View>
              <Text className="text-[15px] font-bold text-foreground">Change PIN</Text>
              <Text className="text-[12px] text-muted-foreground mt-0.5">Used for withdrawals</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#cbd5e1" />
          </Pressable>
        </View>

        <Text className="text-[16px] font-bold text-foreground mb-3 ml-1">
          Two-Factor Authentication
        </Text>
        <Pressable
          className="bg-card rounded-[24px] border border-border overflow-hidden p-5 mb-6"
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          onPress={() => router.push("/(vendor)/(settings)/two-factor")}
        >
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-primary-subtle items-center justify-center mr-3">
                <Icon name="shield" size={18} color="var(--color-primary)" />
              </View>
              <View>
                <Text className="text-[15px] font-bold text-foreground">Manage 2FA</Text>
                <Text className="text-[13px] text-green-600 font-bold mt-0.5">Enabled</Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} color="#cbd5e1" />
          </View>
          <Text className="text-[13px] text-muted-foreground leading-relaxed">
            We'll ask for a code from your authenticator app when you log in from an unrecognized
            device or withdraw funds.
          </Text>
        </Pressable>

        <Text className="text-[16px] font-bold text-foreground mb-3 ml-1">Recent Devices</Text>
        <View className="bg-card rounded-[24px] border border-border overflow-hidden">
          <View className="p-4 border-b border-border flex-row items-center">
            <Icon name="smartphone" size={24} color="#64748b" style={{ marginRight: 16 }} />
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-foreground">iPhone 14 Pro</Text>
              <Text className="text-[12px] text-primary font-bold">This Device • Active Now</Text>
            </View>
            <View className="w-2 h-2 rounded-full bg-green-500" />
          </View>
          <Pressable
            className="p-4 flex-row items-center"
            style={({ pressed }) => [{ backgroundColor: pressed ? "#f8fafc" : "white" }]}
            onPress={() =>
              setSelectedDevice({
                name: "MacBook Pro",
                location: "Accra, Ghana",
                time: "2 days ago",
              })
            }
          >
            <Icon name="monitor" size={24} color="#64748b" style={{ marginRight: 16 }} />
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-foreground">MacBook Pro</Text>
              <Text className="text-[12px] text-muted-foreground">Accra, Ghana • 2 days ago</Text>
            </View>
            <Icon name="more-vertical" size={20} color="#cbd5e1" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Device Session Modal */}
      <Modal
        visible={!!selectedDevice}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedDevice(null)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setSelectedDevice(null)} />
          <View className="bg-card rounded-t-[32px] p-6 pb-12">
            <View className="w-12 h-1.5 bg-secondary rounded-full self-center mb-6" />

            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-muted items-center justify-center mb-4">
                <Icon name="monitor" size={32} color="#64748b" />
              </View>
              <Text className="text-[20px] font-heading font-bold text-foreground">
                {selectedDevice?.name}
              </Text>
              <Text className="text-[14px] text-muted-foreground mt-1">
                {selectedDevice?.location} • Last active {selectedDevice?.time}
              </Text>
            </View>

            <View className="gap-3">
              <Pressable
                className="w-full py-4 rounded-full bg-red-50 flex-row items-center justify-center"
                onPress={() => {
                  // Mock logging out
                  setSelectedDevice(null);
                }}
              >
                <Icon name="log-out" size={20} color="#ef4444" style={{ marginRight: 8 }} />
                <Text className="text-[16px] font-bold text-red-600">Log out of this device</Text>
              </Pressable>

              <Pressable
                className="w-full py-4 rounded-full bg-muted items-center justify-center"
                onPress={() => setSelectedDevice(null)}
              >
                <Text className="text-[16px] font-bold text-muted-foreground">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
