import { tokens } from "@/theme/tokens";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SegmentedOtpInput } from "../../src/components/ui/SegmentedOtpInput";
import { authClient } from "../../src/lib/api/better-auth";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Tick01Icon } from "@hugeicons/core-free-icons";

export default function VerifyPhoneScreen() {
  const { phone, email } = useLocalSearchParams<{ phone: string; email: string }>();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"sending" | "idle" | "verifying" | "success" | "error">(
    phone ? "sending" : "error"
  );
  const [errorMessage, setErrorMessage] = useState(phone ? "" : "No phone number provided.");
  const [countdown, setCountdown] = useState(60);

  const maskPhone = (p?: string) => {
    if (!p) return "";
    if (p.length <= 5) return p;
    return p.slice(0, 4) + "****" + p.slice(-2);
  };

  const maskEmail = (e?: string) => {
    if (!e) return "";
    const [user, domain] = e.split("@");
    if (!domain) return e;
    const maskedUser = user.length > 2 ? user[0] + "***" + user[user.length - 1] : user[0] + "***";
    return `${maskedUser}@${domain}`;
  };

  const getNormalizedPhone = useCallback(() => {
    if (!phone) return "";
    let normalizedPhone = (phone as string).trim().replace(/\s+/g, "");
    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = "+233" + normalizedPhone.slice(1);
    } else if (normalizedPhone.length > 0 && !normalizedPhone.startsWith("+")) {
      normalizedPhone = "+" + normalizedPhone;
    }
    return normalizedPhone;
  }, [phone]);

  const sendOTP = useCallback(async () => {
    setStatus("sending");
    setErrorMessage("");
    try {
      const normalizedPhone = getNormalizedPhone();
      const res = await authClient.phoneNumber.sendOtp({ phoneNumber: normalizedPhone });
      if (res.error) {
        setErrorMessage(res.error.message || "Failed to send verification code.");
        setStatus("error");
      } else {
        setStatus("idle");
        setCountdown(60);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setStatus("error");
    }
  }, [getNormalizedPhone]);

  const verifyOTP = useCallback(
    async (codeToVerify: string) => {
      setStatus("verifying");
      setErrorMessage("");
      try {
        const normalizedPhone = getNormalizedPhone();
        const res = await authClient.phoneNumber.verify({
          phoneNumber: normalizedPhone,
          code: codeToVerify,
        });

        if (res.error) {
          setErrorMessage(res.error.message || "Invalid or expired code.");
          setStatus("error");
        } else {
          setStatus("success");
          setTimeout(() => {
            router.replace(
              `/(auth)/verify-email?email=${encodeURIComponent(email as string)}&phoneVerified=true`
            );
          }, 1500);
        }
      } catch (err: any) {
        setErrorMessage(err.message || "An unexpected error occurred.");
        setStatus("error");
      }
    },
    [email, getNormalizedPhone]
  );

  // Auto-send OTP on mount
  useEffect(() => {
    if (phone) {
      const timer = setTimeout(() => {
        sendOTP();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [phone, sendOTP]);

  // Handle countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center py-12 px-6">
        {status === "success" ? (
          <View className="items-center justify-center">
            <View className="w-20 h-20 rounded-full bg-green-50 items-center justify-center mb-6 border border-green-100">
              <HugeiconsIcon icon={Tick01Icon} size={32} color={tokens.success} />
            </View>
            <Text className="text-display-sm font-heading font-black text-foreground text-center">
              Verified
            </Text>
          </View>
        ) : (
          <View className="items-center w-full">
            <Text className="text-display-md font-heading font-black text-foreground mb-3 text-center">
              Enter code
            </Text>
            <Text className="text-body-lg text-muted-foreground font-body text-center leading-relaxed">
              We sent a verification code to your phone and email:{"\n"}
              <Text className="font-bold text-foreground">{maskPhone(phone)}</Text>
              {email ? (
                <Text className="font-bold text-foreground"> &amp; {maskEmail(email)}</Text>
              ) : null}
            </Text>

            {/* Segmented Agency-Tier OTP Bezel Input */}
            <SegmentedOtpInput
              code={code}
              onChangeCode={(text) => {
                if (status === "error") {
                  setStatus("idle");
                  setErrorMessage("");
                }
                setCode(text);
                if (text.length === 6) {
                  verifyOTP(text);
                }
              }}
              status={status}
              disabled={status === "verifying" || status === "sending"}
            />

            {/* Dynamic Status / Error Display */}
            <View className="h-10 justify-center items-center w-full mb-6">
              {status === "verifying" && (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color={tokens.primary} />
                  <Text className="text-body-md text-primary font-bold font-body">
                    Verifying...
                  </Text>
                </View>
              )}
              {status === "sending" && (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color={tokens.primary} />
                  <Text className="text-body-md text-muted-foreground font-body">
                    Sending code...
                  </Text>
                </View>
              )}
              {status === "error" && errorMessage && (
                <Text className="text-body-md text-error font-body font-medium text-center">
                  {errorMessage}
                </Text>
              )}
            </View>

            {/* Minimal Resend Action */}
            <TouchableOpacity
              onPress={sendOTP}
              disabled={countdown > 0 || status === "sending" || status === "verifying"}
              className="py-2 px-4"
            >
              <Text
                className={`text-body-md font-bold font-body ${countdown > 0 ? "text-muted-foreground" : "text-primary"}`}
              >
                {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
