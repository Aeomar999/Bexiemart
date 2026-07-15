import { tokens } from "@/theme/tokens";
import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, Modal, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import {
  useSessions,
  useRevokeSession,
  useRevokeOtherSessions,
  parseDeviceLabel,
} from "@/lib/hooks/use-sessions";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePopupStore } from "@/lib/stores/popup-store";
import { type SessionItem } from "@/lib/api/sessions";

export default function SecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: sessions, isLoading: sessionsLoading } = useSessions();
  const revokeSession = useRevokeSession();
  const revokeOtherSessions = useRevokeOtherSessions();
  const { token: currentToken, logout } = useAuthStore();
  const { showPopup } = usePopupStore();

  const [selectedDevice, setSelectedDevice] = useState<SessionItem | null>(null);

  const handleRevokeDevice = async () => {
    if (!selectedDevice) return;
    const isCurrent = selectedDevice.token === currentToken;
    try {
      await revokeSession.mutateAsync(selectedDevice.token);
      showPopup({
        type: "success",
        title: "Session revoked",
        message: isCurrent
          ? "You have been logged out of this device."
          : "Device successfully logged out.",
      });
      setSelectedDevice(null);
      if (isCurrent) {
        await logout();
      }
    } catch (e: any) {
      showPopup({
        type: "error",
        title: "Revoke failed",
        message: e?.response?.data?.message || e?.message || "Could not revoke session.",
      });
    }
  };

  const handleRevokeOtherDevices = async () => {
    try {
      await revokeOtherSessions.mutateAsync();
      showPopup({
        type: "success",
        title: "Other sessions revoked",
        message: "Logged out of all other devices.",
      });
    } catch (e: any) {
      showPopup({
        type: "error",
        title: "Revoke failed",
        message: e?.response?.data?.message || e?.message || "Could not revoke other sessions.",
      });
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="mr-3" />
        <Text className="text-display-sm font-heading font-black text-foreground">Security</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
          <Pressable
            className="p-4 border-b border-border flex-row justify-between items-center"
            style={({ pressed }) => [{ backgroundColor: pressed ? "#f8fafc" : "white" }]}
            onPress={() => router.push("/(vendor)/(settings)/change-password")}
          >
            <View>
              <Text className="text-body-lg font-bold text-foreground">Change Password</Text>
              <Text className="text-body-sm text-muted-foreground mt-0.5">
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
              <Text className="text-body-lg font-bold text-foreground">Change PIN</Text>
              <Text className="text-body-sm text-muted-foreground mt-0.5">
                Used for withdrawals
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color="#cbd5e1" />
          </Pressable>
        </View>

        <Text className="text-body-lg font-bold text-foreground mb-3 ml-1">
          Two-Factor Authentication
        </Text>
        <Pressable
          className="bg-card rounded-2xl border border-border overflow-hidden p-5 mb-6"
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          onPress={() => router.push("/(vendor)/(settings)/two-factor")}
        >
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-primary-subtle items-center justify-center mr-3">
                <Icon name="shield" size={18} color={tokens.primary} />
              </View>
              <View>
                <Text className="text-body-lg font-bold text-foreground">Manage 2FA</Text>
                <Text className="text-sm text-green-600 font-bold mt-0.5">Enabled</Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} color="#cbd5e1" />
          </View>
          <Text className="text-sm text-muted-foreground leading-relaxed">
            We'll ask for a code from your authenticator app when you log in from an unrecognized
            device or withdraw funds.
          </Text>
        </Pressable>

        <View className="flex-row items-center justify-between mb-3 ml-1">
          <Text className="text-body-lg font-bold text-foreground">Active Sessions</Text>
          {sessions && sessions.length > 1 && (
            <Pressable onPress={handleRevokeOtherDevices} disabled={revokeOtherSessions.isPending}>
              <Text className="text-body-sm font-bold text-error">Log out others</Text>
            </Pressable>
          )}
        </View>

        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-8">
          {sessionsLoading ? (
            <View className="p-8 items-center justify-center">
              <ActivityIndicator size="small" color={tokens.primary} />
            </View>
          ) : sessions && sessions.length > 0 ? (
            sessions.map((session, index) => {
              const isCurrent = session.token === currentToken;
              const deviceLabel = parseDeviceLabel(session.userAgent);
              const isMobile =
                deviceLabel.includes("iOS") ||
                deviceLabel.includes("Android") ||
                deviceLabel.includes("Mobile");
              const dateStr = session.createdAt
                ? new Date(session.createdAt).toLocaleDateString()
                : "Active";
              const infoText = isCurrent
                ? "This Device • Active Now"
                : session.ipAddress
                  ? `${session.ipAddress} • ${dateStr}`
                  : `Active • ${dateStr}`;

              return (
                <Pressable
                  key={session.id || session.token || index}
                  className={`p-4 flex-row items-center ${index < sessions.length - 1 ? "border-b border-border" : ""}`}
                  style={({ pressed }) => [{ backgroundColor: pressed ? "#f8fafc" : "white" }]}
                  onPress={() => setSelectedDevice(session)}
                >
                  <Icon
                    name={isMobile ? "smartphone" : "monitor"}
                    size={24}
                    color="#64748b"
                    style={{ marginRight: 16 }}
                  />
                  <View className="flex-1 mr-2">
                    <Text className="text-body-lg font-bold text-foreground">{deviceLabel}</Text>
                    <Text
                      className={`text-body-sm mt-0.5 ${isCurrent ? "text-primary font-bold" : "text-muted-foreground"}`}
                    >
                      {infoText}
                    </Text>
                  </View>
                  {isCurrent ? <View className="w-2 h-2 rounded-full bg-green-500 mr-2" /> : null}
                  <Icon name="more-vertical" size={20} color="#cbd5e1" />
                </Pressable>
              );
            })
          ) : (
            <View className="p-6 items-center">
              <Text className="text-body-md text-muted-foreground">No active sessions found</Text>
            </View>
          )}
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
          <View className="bg-card rounded-t-3xl p-6 pb-12">
            <View className="w-12 h-1.5 bg-secondary rounded-full self-center mb-6" />

            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-muted items-center justify-center mb-4">
                <Icon
                  name={
                    parseDeviceLabel(selectedDevice?.userAgent).includes("PC") ||
                    parseDeviceLabel(selectedDevice?.userAgent).includes("Mac")
                      ? "monitor"
                      : "smartphone"
                  }
                  size={32}
                  color="#64748b"
                />
              </View>
              <Text className="text-display-sm font-heading font-bold text-foreground">
                {parseDeviceLabel(selectedDevice?.userAgent)}
              </Text>
              <Text className="text-body-md text-muted-foreground mt-1">
                {selectedDevice?.ipAddress ? `${selectedDevice.ipAddress} • ` : ""}
                {selectedDevice?.token === currentToken ? "This Device" : "Session active"}
              </Text>
            </View>

            <View className="gap-3">
              <Pressable
                className="w-full py-4 rounded-full bg-red-50 flex-row items-center justify-center"
                onPress={handleRevokeDevice}
                disabled={revokeSession.isPending}
              >
                {revokeSession.isPending ? (
                  <ActivityIndicator size="small" color="#ef4444" style={{ marginRight: 8 }} />
                ) : (
                  <Icon name="log-out" size={20} color="#ef4444" style={{ marginRight: 8 }} />
                )}
                <Text className="text-body-lg font-bold text-error">
                  {selectedDevice?.token === currentToken
                    ? "Log out of this device"
                    : "Log out device"}
                </Text>
              </Pressable>

              <Pressable
                className="w-full py-4 rounded-full bg-muted items-center justify-center"
                onPress={() => setSelectedDevice(null)}
              >
                <Text className="text-body-lg font-bold text-muted-foreground">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
