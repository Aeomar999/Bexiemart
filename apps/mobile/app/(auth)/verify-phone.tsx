import { tokens } from "@/theme/tokens";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../src/components/ui/Button";
import { Announcement } from "../../src/components/ui/Announcement";
import { Input } from "../../src/components/ui/Input";
import { authClient } from "../../src/lib/api/better-auth";
// @ts-expect-error
import { FontAwesome5 } from "@expo/vector-icons";

export default function VerifyPhoneScreen() {
  const { phone, email } = useLocalSearchParams<{ phone: string; email: string }>();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"sending" | "idle" | "verifying" | "success" | "error">(
    "sending"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(60);

  // Auto-send OTP on mount
  useEffect(() => {
    if (phone) {
      sendOTP();
    } else {
      setStatus("error");
      setErrorMessage("No phone number provided.");
    }
  }, [phone]);

  // Handle countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-verify when 6 digits are entered
  useEffect(() => {
    if (code.length === 6 && status === "idle") {
      verifyOTP();
    }
  }, [code]);

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

  const getNormalizedPhone = () => {
    let normalizedPhone = (phone as string).trim().replace(/\s+/g, "");
    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = "+233" + normalizedPhone.slice(1);
    } else if (normalizedPhone.length > 0 && !normalizedPhone.startsWith("+")) {
      normalizedPhone = "+" + normalizedPhone;
    }
    return normalizedPhone;
  };

  const sendOTP = async () => {
    setStatus("sending");
    setErrorMessage("");
    try {
      const normalizedPhone = getNormalizedPhone();
      // @ts-expect-error - Better Auth plugin types might not infer correctly
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
  };

  const verifyOTP = async () => {
    setStatus("verifying");
    setErrorMessage("");
    try {
      const normalizedPhone = getNormalizedPhone();
      // @ts-expect-error - Better Auth plugin types might not infer correctly
      const res = await authClient.phoneNumber.verify({
        phoneNumber: normalizedPhone,
        code,
      });

      if (res.error) {
        setErrorMessage(res.error.message || "Invalid or expired code.");
        setStatus("error");
      } else {
        setStatus("success");
        // Show success briefly before moving to email verification
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
  };

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
              <FontAwesome5 name="check" size={32} color="#16A34A" />
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

            {/* Custom Premium OTP Input */}
            <View className="flex-row justify-center gap-3 mt-10 mb-8 w-full relative">
              {[...Array(6)].map((_, i) => (
                <View
                  key={i}
                  pointerEvents="none"
                  className={`w-12 h-14 rounded-lg items-center justify-center border-b-2 ${
                    code.length === i
                      ? "border-primary bg-primary-subtle"
                      : code.length > i
                        ? "border-foreground bg-muted"
                        : "border-border bg-background"
                  }`}
                >
                  <Text className="text-display-md font-heading font-bold text-foreground">
                    {code[i] || ""}
                  </Text>
                </View>
              ))}
              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={(text) => {
                  if (status === "error") {
                    setStatus("idle");
                    setErrorMessage("");
                  }
                  setCode(text);
                }}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                maxLength={6}
                autoFocus
                editable={status === "idle" || status === "error"}
                className="absolute w-full h-full opacity-0"
                caretHidden={true}
              />
            </View>

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
