import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { useRegister } from "../../src/lib/hooks/use-auth";
import { useState } from "react";
// @ts-expect-error
import { FontAwesome5 } from "@expo/vector-icons";
import { SocialLogins } from "../../src/components/auth/SocialLogins";

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterScreen() {
  const registerMutation = useRegister();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"customer" | "vendor">("customer");
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (phone.trim().length < 10) {
      newErrors.phone = "Enter a valid phone number";
    }
    if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    registerMutation.mutate(
      { name: name.trim(), email: email.trim(), password, role },
      {
        onSuccess: () => router.replace("/(auth)/login"),
      }
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-12 pt-6 px-6"
      keyboardShouldPersistTaps="handled"
    >
      <View className="mb-8 mt-4">
        <BackButton className="mb-6" />
        <Text className="text-display-md font-heading font-bold text-foreground mb-1">
          Create account
        </Text>
        <Text className="text-body-lg text-muted-foreground font-body">
          Join the campus marketplace
        </Text>
      </View>

      <View className="bg-card p-6 rounded-3xl shadow-sm border border-border gap-5">
        <Input
          label="Full name"
          placeholder="Kofi Mensah"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
          error={errors.name}
          leftIcon={<FontAwesome5 name="user" size={16} color="#94A3B8" solid />}
        />

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
          label="Phone number"
          placeholder="024 123 4567"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          error={errors.phone}
          leftIcon={<FontAwesome5 name="phone" size={16} color="#94A3B8" solid />}
        />

        <Input
          label="Password"
          placeholder="Min 6 characters"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          leftIcon={<FontAwesome5 name="lock" size={16} color="#94A3B8" solid />}
        />

        <Input
          label="Confirm password"
          placeholder="Re-enter your password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={errors.confirmPassword}
          leftIcon={<FontAwesome5 name="lock" size={16} color="#94A3B8" solid />}
        />

        <View>
          <Text className="text-body-sm font-medium text-muted-foreground font-body mb-3">
            I want to
          </Text>
          <View className="flex-row gap-3 bg-background p-1 rounded-2xl border border-border">
            <TouchableOpacity
              onPress={() => setRole("customer")}
              className="flex-1 h-12 rounded-xl items-center justify-center flex-row gap-2"
              style={role === "customer" ? {
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#E2E8F0",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
              } : {
                backgroundColor: "transparent",
              }}
            >
              <FontAwesome5 name="shopping-bag" size={14} color={role === "customer" ? "#004CFF" : "#64748B"} />
              <Text
                className="font-heading font-semibold"
                style={{ color: role === "customer" ? "#004CFF" : "#64748B" }}
              >
                Shop
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRole("vendor")}
              className="flex-1 h-12 rounded-xl items-center justify-center flex-row gap-2"
              style={role === "vendor" ? {
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#E2E8F0",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
              } : {
                backgroundColor: "transparent",
              }}
            >
              <FontAwesome5 name="store" size={14} color={role === "vendor" ? "#004CFF" : "#64748B"} />
              <Text
                className="font-heading font-semibold"
                style={{ color: role === "vendor" ? "#004CFF" : "#64748B" }}
              >
                Sell
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {registerMutation.error && (
          <Text className="text-body-sm text-error font-body text-center">
            {registerMutation.error?.message ?? "Registration failed. Please try again."}
          </Text>
        )}

        <View className="w-full mt-2">
          <Button
            title="Create Account"
            size="lg"
            loading={registerMutation.isPending}
            onPress={handleSubmit}
          />
        </View>
      </View>

      <SocialLogins />

      <View className="flex-row justify-center mt-10 gap-2">
        <Text className="text-body-md text-muted-foreground font-body">
          Already have an account?
        </Text>
        <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
          <Text className="text-body-md text-brand-600 font-bold font-body">
            Sign in
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}