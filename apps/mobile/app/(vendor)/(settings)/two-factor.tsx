import { BackButton } from "@/components/ui/BackButton";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useState } from "react";
import {
  useTwoFactorStatus,
  useEnableTwoFactor,
  useVerifyTotp,
  useDisableTwoFactor,
  useGenerateBackupCodes,
} from "@/lib/hooks/use-two-factor";
import { usePopupStore } from "@/lib/stores/popup-store";
import { SegmentedOtpInput } from "@/components/ui/SegmentedOtpInput";

export default function TwoFactorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showPopup } = usePopupStore();

  const { data: statusData, isLoading: isStatusLoading } = useTwoFactorStatus();
  const enableMutation = useEnableTwoFactor();
  const verifyMutation = useVerifyTotp();
  const disableMutation = useDisableTwoFactor();
  const regenerateMutation = useGenerateBackupCodes();

  const is2FAEnabled = Boolean(statusData?.twoFactorEnabled);

  const [activeModal, setActiveModal] = useState<"password" | "verify" | "backupCodes" | null>(
    null
  );
  const [pendingAction, setPendingAction] = useState<"enable" | "disable" | "regenerate" | null>(
    null
  );
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupCodeCount, setBackupCodeCount] = useState<number>(10);

  const handleToggleSwitch = (value: boolean) => {
    if (value) {
      setPendingAction("enable");
      setActiveModal("password");
    } else {
      setPendingAction("disable");
      setActiveModal("password");
    }
  };

  const handleRecoveryCodesPress = () => {
    setPendingAction("regenerate");
    setActiveModal("password");
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      showPopup({
        type: "error",
        title: "Password required",
        message: "Please enter your account password to continue.",
      });
      return;
    }

    try {
      if (pendingAction === "enable") {
        const res = await enableMutation.mutateAsync(password);
        setTotpURI(res.totpURI || "");
        setBackupCodes(res.backupCodes || []);
        setBackupCodeCount(res.backupCodes?.length || 10);
        setPassword("");
        setActiveModal("verify");
      } else if (pendingAction === "disable") {
        await disableMutation.mutateAsync(password);
        setPassword("");
        setActiveModal(null);
        showPopup({
          type: "success",
          title: "2FA Disabled",
          message: "Two-factor authentication has been turned off.",
        });
      } else if (pendingAction === "regenerate") {
        const res = await regenerateMutation.mutateAsync(password);
        setBackupCodes(res.backupCodes || []);
        setBackupCodeCount(res.backupCodes?.length || 10);
        setPassword("");
        setActiveModal("backupCodes");
      }
    } catch (e: any) {
      showPopup({
        type: "error",
        title: "Action failed",
        message: e?.response?.data?.message || e?.message || "Could not complete request.",
      });
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      showPopup({
        type: "error",
        title: "Invalid code",
        message: "Please enter a 6-digit verification code.",
      });
      return;
    }

    try {
      await verifyMutation.mutateAsync(code);
      setCode("");
      setActiveModal("backupCodes");
      showPopup({
        type: "success",
        title: "2FA Activated",
        message: "Two-factor authentication is now active on your account.",
      });
    } catch (e: any) {
      showPopup({
        type: "error",
        title: "Verification failed",
        message: e?.response?.data?.message || e?.message || "Invalid verification code.",
      });
    }
  };

  const secretMatch = totpURI.match(/secret=([^&]+)/i);
  const displaySecret = secretMatch ? secretMatch[1] : totpURI || "No secret provided";

  const isPending =
    enableMutation.isPending || disableMutation.isPending || regenerateMutation.isPending;

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="mr-3" />
        <Text className="text-display-sm font-heading font-black text-foreground">
          Two-Factor Auth
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <View className="items-center mb-8 mt-4">
          <View
            className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${
              is2FAEnabled ? "bg-green-100" : "bg-secondary"
            }`}
          >
            <Icon name="shield" size={40} color={is2FAEnabled ? "#10b981" : "#94a3b8"} />
          </View>
          <Text className="text-display-sm font-heading font-black text-foreground mb-2">
            {isStatusLoading
              ? "Checking Status..."
              : is2FAEnabled
                ? "2FA is Active"
                : "2FA is Disabled"}
          </Text>
          <Text className="text-body-md text-muted-foreground text-center px-4 leading-relaxed">
            Two-factor authentication adds an extra layer of security to your account by requiring
            more than just a password to log in.
          </Text>
        </View>

        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-6 p-5">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-muted items-center justify-center mr-3">
                <Icon name="smartphone" size={20} color="#64748b" />
              </View>
              <View className="flex-1 pr-4">
                <Text className="text-body-lg font-bold text-foreground">Authenticator App</Text>
                <Text className="text-body-sm text-muted-foreground mt-0.5">
                  Use an app like Google Authenticator or Authy.
                </Text>
              </View>
            </View>
            {isStatusLoading ? (
              <ActivityIndicator size="small" color="#10b981" />
            ) : (
              <Switch
                value={is2FAEnabled}
                onValueChange={handleToggleSwitch}
                trackColor={{ true: "#10b981" }}
                testID="2fa-toggle-switch"
              />
            )}
          </View>
        </View>

        {is2FAEnabled && (
          <>
            <Text className="text-body-lg font-bold text-foreground mb-3 ml-1">Backup Methods</Text>
            <View className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
              <Pressable
                className="p-5 flex-row justify-between items-center"
                onPress={handleRecoveryCodesPress}
                testID="recovery-codes-pressable"
              >
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-muted items-center justify-center mr-3">
                    <Icon name="file-text" size={20} color="#64748b" />
                  </View>
                  <View className="flex-1 pr-4">
                    <Text className="text-body-lg font-bold text-foreground">Recovery Codes</Text>
                    <Text className="text-body-sm text-muted-foreground mt-0.5">
                      {backupCodeCount} codes remaining • Tap to view or regenerate
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color="#cbd5e1" />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {/* Password Prompt Modal */}
      <Modal
        visible={activeModal === "password"}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setActiveModal(null)} />
          <View className="bg-card rounded-t-3xl p-6 pb-12">
            <View className="w-12 h-1.5 bg-secondary rounded-full self-center mb-6" />

            <Text className="text-display-sm font-heading font-bold text-foreground mb-2 text-center">
              Enter Password
            </Text>
            <Text className="text-body-md text-muted-foreground text-center mb-6">
              Please confirm your password to{" "}
              {pendingAction === "enable"
                ? "setup two-factor authentication."
                : pendingAction === "disable"
                  ? "disable two-factor authentication."
                  : "regenerate your recovery codes."}
            </Text>

            <View className="bg-muted/30 border border-border rounded-xl px-4 py-3 mb-6">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Account password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                className="text-body-lg text-foreground"
                autoCapitalize="none"
                testID="password-input"
              />
            </View>

            <View className="gap-3">
              <Pressable
                className="w-full py-4 rounded-full bg-primary flex-row items-center justify-center"
                onPress={handlePasswordSubmit}
                disabled={isPending}
                testID="password-submit-button"
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                ) : null}
                <Text className="text-body-lg font-bold text-primary-foreground">Continue</Text>
              </Pressable>

              <Pressable
                className="w-full py-4 rounded-full bg-muted items-center justify-center"
                onPress={() => {
                  setActiveModal(null);
                  setPassword("");
                }}
              >
                <Text className="text-body-lg font-bold text-muted-foreground">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* TOTP Setup Verification Modal */}
      <Modal
        visible={activeModal === "verify"}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setActiveModal(null)} />
          <View className="bg-card rounded-t-3xl p-6 pb-12">
            <View className="w-12 h-1.5 bg-secondary rounded-full self-center mb-6" />

            <Text className="text-display-sm font-heading font-bold text-foreground mb-2 text-center">
              Configure Authenticator
            </Text>
            <Text className="text-body-md text-muted-foreground text-center mb-4">
              Enter this secret key in Google Authenticator or Authy:
            </Text>

            <View className="bg-primary/10 border border-primary/30 rounded-xl p-4 items-center mb-6">
              <Text className="text-body-lg font-mono font-bold text-primary text-center selectable">
                {displaySecret}
              </Text>
            </View>

            <Text className="text-body-md text-muted-foreground text-center mb-2">
              Then enter the 6-digit code generated by your app:
            </Text>

            <SegmentedOtpInput
              code={code}
              onChangeCode={setCode}
              status={verifyMutation.isPending ? "verifying" : "idle"}
              disabled={verifyMutation.isPending}
            />

            <View className="gap-3 mt-4">
              <Pressable
                className="w-full py-4 rounded-full bg-primary flex-row items-center justify-center"
                onPress={handleVerifyCode}
                disabled={verifyMutation.isPending}
                testID="verify-code-button"
              >
                {verifyMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                ) : null}
                <Text className="text-body-lg font-bold text-primary-foreground">
                  Verify & Activate
                </Text>
              </Pressable>

              <Pressable
                className="w-full py-4 rounded-full bg-muted items-center justify-center"
                onPress={() => {
                  setActiveModal(null);
                  setCode("");
                }}
              >
                <Text className="text-body-lg font-bold text-muted-foreground">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Backup Codes Modal */}
      <Modal
        visible={activeModal === "backupCodes"}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setActiveModal(null)} />
          <View className="bg-card rounded-t-3xl p-6 pb-12 max-h-[85%]">
            <View className="w-12 h-1.5 bg-secondary rounded-full self-center mb-6" />

            <Text className="text-display-sm font-heading font-bold text-foreground mb-2 text-center">
              Recovery Codes
            </Text>
            <Text className="text-body-md text-muted-foreground text-center mb-6">
              Save these codes securely. Each code can only be used once if you lose access to your
              authenticator app.
            </Text>

            <ScrollView className="bg-muted/30 border border-border rounded-2xl p-4 mb-6 max-h-64">
              <View className="flex-row flex-wrap justify-between">
                {backupCodes.map((bc, idx) => (
                  <View key={idx} className="w-[48%] py-2 items-center">
                    <Text className="text-body-md font-mono font-bold text-foreground">{bc}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            <Pressable
              className="w-full py-4 rounded-full bg-primary items-center justify-center"
              onPress={() => setActiveModal(null)}
              testID="backup-codes-done-button"
            >
              <Text className="text-body-lg font-bold text-primary-foreground">Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
