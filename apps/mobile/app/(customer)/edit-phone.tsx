import { useState } from "react";
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";
import { useCurrentUser } from "@/lib/hooks/use-auth";
import { authClient } from "@/lib/api/better-auth";
import { Announcement } from "@/components/ui/Announcement";

export default function EditPhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: user, refetch } = useCurrentUser();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestVerification = async () => {
    if (phone.trim().length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await authClient.phoneNumber.sendOtp({
        phoneNumber: phone.trim(),
      });

      if (res.error) {
        setError(res.error.message || "Failed to send verification code");
      } else {
        setStep("verify");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (code.trim().length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await authClient.phoneNumber.verify({
        phoneNumber: phone,
        code,
      });

      if (res.error) {
        setError(res.error.message || "Invalid or expired verification code");
      } else {
        Alert.alert("Success", "Your phone number has been verified and updated successfully.", [
          {
            text: "OK",
            onPress: () => {
              refetch(); // Refresh current user data
              router.back();
            },
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-[20px] font-heading font-black text-foreground">
            Update Phone Number
          </Text>
        </View>
      </View>
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-12">
        <Text className="text-body-lg text-muted-foreground font-body mt-4 mb-8">
          {step === "request"
            ? "Enter your new phone number. We'll send a verification code to confirm it belongs to you."
            : `We've sent a 6-digit verification code to ${phone}. Please enter it below.`}
        </Text>

        {error ? <Announcement type="error" message={error} /> : null}

        <View className={`bg-card p-6 rounded-[24px] border border-border ${error ? "mt-4" : ""}`}>
          {step === "request" ? (
            <>
              <Input
                label="New Phone Number"
                placeholder="024 123 4567"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setError("");
                }}
              />
              <View className="mt-4">
                <Button
                  title="Send Verification Code"
                  size="lg"
                  loading={loading}
                  onPress={handleRequestVerification}
                />
              </View>
            </>
          ) : (
            <>
              <Input
                label="Verification Code"
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={(text) => {
                  setCode(text);
                  setError("");
                }}
                className="text-center text-[24px] tracking-widest font-heading font-bold"
              />
              <View className="mt-4 gap-3">
                <Button
                  title="Verify & Save"
                  size="lg"
                  loading={loading}
                  onPress={handleVerifyOTP}
                />
                <Button
                  title="Use a different number"
                  variant="outline"
                  size="lg"
                  disabled={loading}
                  onPress={() => setStep("request")}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
