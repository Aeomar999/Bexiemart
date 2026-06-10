import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "../../src/components/ui/BackButton";
import { useAuthStore } from "../../src/lib/stores/auth-store";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { Announcement } from "../../src/components/ui/Announcement";
import { useLogin, useResendVerification } from "../../src/lib/hooks/use-auth";
// @ts-expect-error
import { FontAwesome5 } from "@expo/vector-icons";
import { SocialLogins } from "../../src/components/auth/SocialLogins";
import { LinearGradient } from "expo-linear-gradient";

import { useFormValidation } from "../../src/lib/hooks/use-form-validation";
import { loginSchema } from "../../src/lib/validation/schemas";

export default function LoginScreen() {
  const { isAuthenticated, setAuth } = useAuthStore();
  const login = useLogin();
  const resendVerification = useResendVerification();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { errors, validate } = useFormValidation(loginSchema);
  const [isEmailNotVerified, setIsEmailNotVerified] = useState(false);
  const [resendError, setResendError] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated]);

  const handleSubmit = () => {
    if (!validate({ email, password })) return;
    setIsEmailNotVerified(false);
    login.mutate(
      { email: email.trim(), password },
      {
        onError: (err: any) => {
          const msg = err?.message?.toLowerCase() || "";
          if (msg.includes("email not verified") || msg.includes("verify your email")) {
            setIsEmailNotVerified(true);
          }
        },
      }
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background px-6" style={{ paddingTop: insets.top }}>
      <View className="absolute top-4 left-2 z-10" style={{ top: insets.top + 8 }}>
        <BackButton />
      </View>
      <View className="flex-1 justify-center py-12">
        <View className="mb-10 items-center">
          <View className="w-16 h-16 rounded-2xl bg-brand-100 items-center justify-center mb-6">
            <FontAwesome5 name="store" size={28} color="#004CFF" />
          </View>
          <Text className="text-display-md font-heading font-bold text-foreground mb-2 text-center">
            Welcome back
          </Text>
          <Text className="text-body-lg text-muted-foreground font-body text-center">
            Sign in to continue shopping on campus
          </Text>
        </View>

        <View className="bg-card p-6 rounded-3xl border border-border gap-5">
          <Input
            label="Email address"
            placeholder="you@school.edu.gh"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => setEmail(text.replace(/[^a-zA-Z0-9@._+-]/g, ""))}
            error={errors.email}
            leftIcon={<FontAwesome5 name="envelope" size={16} color="#94A3B8" solid />}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            leftIcon={<FontAwesome5 name="lock" size={16} color="#94A3B8" solid />}
          />

          <View className="self-end -mt-2">
            <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
              <Text className="text-body-sm text-brand-600 font-bold font-body">
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          {login.error && !isEmailNotVerified && (
            <Announcement
              type="error"
              message={login.error?.message ?? "Login failed. Please try again."}
            />
          )}

          {isEmailNotVerified && (
            <View className="mt-2 overflow-hidden rounded-3xl border border-brand-200">
              <LinearGradient
                colors={["#F0F4FF", "#FAFCFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-5"
              >
                <View className="flex-row items-center gap-4 mb-5">
                  <View className="w-14 h-14 bg-white rounded-full shadow-sm items-center justify-center border border-brand-100">
                    <FontAwesome5 name="envelope-open-text" size={22} color="#004CFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[18px] font-heading font-black text-brand-900 mb-1">
                      Check your inbox
                    </Text>
                    <Text className="text-[13px] text-brand-700 font-body leading-relaxed">
                      We sent a link to <Text className="font-bold text-brand-900">{email}</Text>
                    </Text>
                  </View>
                </View>

                <View className="bg-white/60 p-4 rounded-2xl mb-5 border border-white">
                  <Text className="text-[13px] text-brand-800 font-body leading-relaxed">
                    Tap the verification link in your email before signing in.
                  </Text>
                  <View className="mt-2 flex-row items-start gap-2 bg-brand-50 p-3 rounded-xl border border-brand-100">
                    <FontAwesome5
                      name="info-circle"
                      size={14}
                      color="#004CFF"
                      style={{ marginTop: 2 }}
                    />
                    <Text className="flex-1 text-[12px] text-brand-700 leading-tight">
                      <Text className="font-bold">Testing locally?</Text> Phone browsers can't open
                      "localhost" links. Copy the link to your PC browser, or update your .env to
                      use your local IP address (e.g., 192.168.x.x) instead of localhost.
                    </Text>
                  </View>
                </View>

                {resendError ? (
                  <Text className="text-[13px] text-red-600 font-body mb-3 px-1 text-center">
                    {resendError}
                  </Text>
                ) : resendVerification.isSuccess && countdown > 0 ? (
                  <View className="flex-row items-center justify-center gap-2 mb-4">
                    <FontAwesome5 name="check-circle" size={14} color="#16A34A" />
                    <Text className="text-[13px] font-bold text-green-700">
                      Link sent! Check your email.
                    </Text>
                  </View>
                ) : null}

                {countdown > 0 ? (
                  <View className="bg-white/80 border border-brand-100 py-3.5 px-4 rounded-full flex-row items-center justify-center gap-2">
                    <FontAwesome5 name="clock" size={14} color="#004CFF" />
                    <Text className="text-[14px] font-bold text-brand-900">
                      Resend available in {Math.floor(countdown / 60)}:
                      {(countdown % 60).toString().padStart(2, "0")}
                    </Text>
                  </View>
                ) : (
                  <Button
                    title="Resend Verification Link"
                    size="md"
                    variant="primary"
                    loading={resendVerification.isPending}
                    onPress={() => {
                      setResendError("");
                      resendVerification.mutate(email, {
                        onSuccess: () => {
                          setCountdown(180);
                        },
                        onError: (err: any) => {
                          setResendError(err?.message || "Failed to resend.");
                        },
                      });
                    }}
                  />
                )}
              </LinearGradient>
            </View>
          )}

          <View className="w-full mt-2">
            <Button title="Sign In" size="lg" loading={login.isPending} onPress={handleSubmit} />
          </View>
        </View>

        <SocialLogins />

        <View className="flex-row justify-center mt-10 gap-2">
          <Text className="text-body-md text-muted-foreground font-body">
            Don't have an account?
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text className="text-body-md text-brand-600 font-bold font-body">Create one</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
