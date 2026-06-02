import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "../../src/components/ui/BackButton";
import { useAuthStore } from "../../src/lib/stores/auth-store";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { Announcement } from "../../src/components/ui/Announcement";
import { useLogin } from "../../src/lib/hooks/use-auth";
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

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
    login.mutate({ email: email.trim(), password });
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

          {login.error && (
            <Announcement
              type="error"
              message={login.error?.message ?? "Login failed. Please try again."}
            />
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
