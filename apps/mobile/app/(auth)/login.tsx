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

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const { isAuthenticated, setAuth } = useAuthStore();
  const login = useLogin();
  const resendVerification = useResendVerification();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
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

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
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
            onChangeText={setEmail}
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
            <View className="bg-brand-50 p-5 rounded-3xl border border-brand-100 overflow-hidden relative">
              <View className="flex-row items-start gap-4 mb-4">
                <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-sm">
                  <FontAwesome5 name="envelope-open-text" size={20} color="#004CFF" />
                </View>
                <View className="flex-1 pt-1">
                  <Text className="text-[16px] font-heading font-black text-brand-900 mb-1">
                    Check your inbox
                  </Text>
                  <Text className="text-[13px] text-brand-700 font-body leading-relaxed">
                    We've sent a verification link to{" "}
                    <Text className="font-bold text-brand-900">{email}</Text>. Please verify your
                    email before signing in.
                  </Text>
                </View>
              </View>

              {resendError ? (
                <Text className="text-[13px] text-red-600 font-body mb-3 px-1">{resendError}</Text>
              ) : resendVerification.isSuccess && countdown > 0 ? (
                <View className="flex-row items-center gap-2 mb-4 bg-green-100 p-3 rounded-2xl border border-green-200">
                  <FontAwesome5 name="check-circle" size={14} color="#16A34A" />
                  <Text className="text-[13px] font-bold text-green-800">
                    Verification email sent!
                  </Text>
                </View>
              ) : null}

              <Button
                title={
                  countdown > 0
                    ? `Resend email in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, "0")}`
                    : "Resend verification email"
                }
                size="md"
                variant={countdown > 0 ? "outline" : "primary"}
                className={countdown > 0 ? "bg-white border-brand-200" : ""}
                loading={resendVerification.isPending}
                disabled={countdown > 0}
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
