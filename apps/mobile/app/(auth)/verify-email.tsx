import { View, Text, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../src/components/ui/Button";
import { Announcement } from "../../src/components/ui/Announcement";
import { useVerifyEmail, useResendVerification } from "../../src/lib/hooks/use-auth";
// @ts-expect-error
import { FontAwesome5 } from "@expo/vector-icons";

export default function VerifyEmailScreen() {
  const { token, email, phoneVerified } = useLocalSearchParams<{
    token?: string;
    email?: string;
    phoneVerified?: string;
  }>();
  const verifyEmail = useVerifyEmail();
  const resendVerification = useResendVerification();
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
    token ? "verifying" : "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [resendError, setResendError] = useState("");

  useEffect(() => {
    if (token) {
      verifyEmail.mutate(token, {
        onSuccess: () => setStatus("success"),
        onError: (err: any) => {
          setErrorMessage(
            err?.message || "Verification failed. The link may be invalid or expired."
          );
          setStatus("error");
        },
      });
    }
  }, [token]);

  const handleResend = () => {
    if (!email) return;
    setResendError("");
    resendVerification.mutate(email, {
      onError: (err: any) => {
        setResendError(err?.message || "Failed to resend verification email.");
      },
    });
  };

  return (
    <View className="flex-1 bg-background px-6" style={{ paddingTop: insets.top }}>
      <View className="flex-1 justify-center py-12">
        {status === "verifying" && (
          <View className="items-center">
            <View className="w-16 h-16 rounded-2xl bg-yellow-100 items-center justify-center mb-6">
              <FontAwesome5 name="hourglass-half" size={28} color="#D97706" />
            </View>
            <Text className="text-display-md font-heading font-bold text-foreground mb-2 text-center">
              Verifying your email
            </Text>
            <Text className="text-body-lg text-muted-foreground font-body text-center">
              Please wait...
            </Text>
          </View>
        )}

        {status === "success" && (
          <View className="items-center">
            <View className="w-16 h-16 rounded-2xl bg-green-100 items-center justify-center mb-6">
              <FontAwesome5 name="check-circle" size={28} color="#16A34A" />
            </View>
            <Text className="text-display-md font-heading font-bold text-foreground mb-2 text-center">
              Email verified!
            </Text>
            <Text className="text-body-lg text-muted-foreground font-body text-center mb-8">
              Your email has been verified successfully. You can now sign in.
            </Text>
            <View className="w-full">
              <Button title="Sign In" size="lg" onPress={() => router.replace("/(auth)/login")} />
            </View>
          </View>
        )}

        {status === "error" && (
          <View className="items-center">
            <View className="w-16 h-16 rounded-2xl bg-red-100 items-center justify-center mb-6">
              <FontAwesome5 name="exclamation-circle" size={28} color="#DC2626" />
            </View>
            <Text className="text-display-md font-heading font-bold text-foreground mb-2 text-center">
              Verification failed
            </Text>
            <Announcement type="error" message={errorMessage} />
            {email && (
              <View className="w-full mt-4 gap-3">
                {resendError ? <Announcement type="error" message={resendError} /> : null}
                {resendVerification.isSuccess ? (
                  <Announcement type="success" message="Verification email sent!" />
                ) : null}
                <Button
                  title="Resend verification email"
                  size="lg"
                  loading={resendVerification.isPending}
                  onPress={handleResend}
                />
              </View>
            )}
            <TouchableOpacity className="mt-4" onPress={() => router.replace("/(auth)/login")}>
              <Text className="text-body-md text-primary font-bold font-body">Back to sign in</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === "idle" && !token && (
          <View className="items-center">
            <View className="w-16 h-16 rounded-2xl bg-primary-subtle items-center justify-center mb-6">
              <FontAwesome5 name="envelope-open-text" size={28} color="var(--color-primary)" />
            </View>
            <Text className="text-display-md font-heading font-bold text-foreground mb-2 text-center">
              {phoneVerified === "true" ? "Phone verified! 🎉" : "Check your email"}
            </Text>
            {phoneVerified === "true" && (
              <Text className="text-body-lg text-primary font-body font-bold text-center mb-2">
                Just one last step: Check your email.
              </Text>
            )}
            <Text className="text-body-lg text-muted-foreground font-body text-center">
              We sent a verification link to{"\n"}
              <Text className="font-bold text-foreground">{email || "your email"}</Text>
            </Text>
            <Text className="text-body-md text-muted-foreground font-body text-center mt-6">
              Click the link in the email to verify your account.
            </Text>

            <View className="w-full mt-8">
              <Button
                title="Resend email"
                size="lg"
                variant="outline"
                loading={resendVerification.isPending}
                onPress={handleResend}
              />
            </View>

            {resendVerification.isSuccess && (
              <Announcement type="success" message="Verification email sent!" />
            )}
            {resendError ? <Announcement type="error" message={resendError} /> : null}

            <TouchableOpacity className="mt-4" onPress={() => router.replace("/(auth)/login")}>
              <Text className="text-body-md text-muted-foreground font-body">
                Already verified? <Text className="text-primary font-bold">Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
