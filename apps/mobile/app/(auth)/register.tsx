import { BackButton } from "../../src/components/ui/BackButton";
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { router } from "expo-router";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { Announcement } from "../../src/components/ui/Announcement";
import { useRegister, useCheckAvailability } from "../../src/lib/hooks/use-auth";
import { useState } from "react";
import { useAuthStore } from "../../src/lib/stores/auth-store";
// @ts-expect-error
import { FontAwesome5 } from "@expo/vector-icons";
import { SocialLogins } from "../../src/components/auth/SocialLogins";

import { useFormValidation } from "../../src/lib/hooks/use-form-validation";
import {
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
} from "../../src/lib/validation/schemas";

const { width } = Dimensions.get("window");

export default function RegisterScreen() {
  const registerMutation = useRegister();
  const checkAvailability = useCheckAvailability();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"customer" | "vendor">("customer");

  const [emailCheckError, setEmailCheckError] = useState("");
  const [phoneCheckError, setPhoneCheckError] = useState("");

  const { errors: errors1, validate: validateStep1 } = useFormValidation(registerStep1Schema);
  const { errors: errors2, validate: validateStep2 } = useFormValidation(registerStep2Schema);
  const { errors: errors3, validate: validateStep3 } = useFormValidation(registerStep3Schema);

  const handleNext = async () => {
    if (step === 1) {
      if (!validateStep1({ name })) return;
      setStep(2);
    } else if (step === 2) {
      if (!validateStep2({ email, phone })) return;

      let normalizedPhone = phone.trim().replace(/\s+/g, "");
      if (normalizedPhone.startsWith("0")) {
        normalizedPhone = "+233" + normalizedPhone.slice(1);
      } else if (normalizedPhone.length > 0 && !normalizedPhone.startsWith("+")) {
        normalizedPhone = "+" + normalizedPhone;
      }

      try {
        const res = await checkAvailability.mutateAsync({ email, phone: normalizedPhone });
        let hasError = false;
        if (res?.data?.errors?.email) {
          setEmailCheckError(res.data.errors.email);
          hasError = true;
        } else {
          setEmailCheckError("");
        }
        if (res?.data?.errors?.phone) {
          setPhoneCheckError(res.data.errors.phone);
          hasError = true;
        } else {
          setPhoneCheckError("");
        }

        if (!hasError && res?.data?.isAvailable) {
          setStep(3);
        }
      } catch (err) {
        // If the check fails, we might still want to proceed and let the actual registration catch it,
        // or show a toast. For now, we'll just proceed if we can't verify.
        setStep(3);
      }
    } else if (step === 3) {
      handleSubmit();
    }
  };

  const handleEmailBlur = () => {
    if (!email) return;
    checkAvailability.mutate(
      { email },
      {
        onSuccess: (res) => {
          if (res?.data?.errors?.email) {
            setEmailCheckError(res.data.errors.email);
          } else {
            setEmailCheckError("");
          }
        },
      }
    );
  };

  const handlePhoneBlur = () => {
    if (!phone) return;
    let normalizedPhone = phone.trim().replace(/\s+/g, "");
    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = "+233" + normalizedPhone.slice(1);
    } else if (normalizedPhone.length > 0 && !normalizedPhone.startsWith("+")) {
      normalizedPhone = "+" + normalizedPhone;
    }
    checkAvailability.mutate(
      { phone: normalizedPhone },
      {
        onSuccess: (res) => {
          if (res?.data?.errors?.phone) {
            setPhoneCheckError(res.data.errors.phone);
          } else {
            setPhoneCheckError("");
          }
        },
      }
    );
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push("/(auth)/login");
      }
    }
  };

  const handleSubmit = () => {
    if (!validateStep3({ password, confirmPassword })) return;

    let normalizedPhone = phone.trim().replace(/\s+/g, "");
    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = "+233" + normalizedPhone.slice(1);
    } else if (normalizedPhone.length > 0 && !normalizedPhone.startsWith("+")) {
      normalizedPhone = "+" + normalizedPhone;
    }

    registerMutation.mutate(
      { name: name.trim(), email: email.trim(), password, role, phone: normalizedPhone },
      {
        onSuccess: (response) => {
          if (response?.data?.token) {
            setAuth(response.data.user, response.data.token);
            router.replace("/");
          } else {
            router.replace(
              `/(auth)/verify-phone?phone=${encodeURIComponent(normalizedPhone)}&email=${encodeURIComponent(email.trim())}`
            );
          }
        },
      }
    );
  };

  const progressPercentage = (step / 3) * 100;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-12 pt-6 px-6"
      keyboardShouldPersistTaps="handled"
    >
      <View className="mb-8 mt-4">
        <BackButton onPress={handleBack} className="mb-6 border-brand-100" color="#004CFF" />

        {/* Progress Bar */}
        <View className="w-full h-2 bg-brand-50 rounded-full mb-6 overflow-hidden border border-brand-100">
          <View
            className="h-full bg-brand-600 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </View>

        <Text className="text-display-md font-heading font-bold text-foreground mb-1">
          {step === 1 ? "Account setup" : step === 2 ? "Contact details" : "Secure account"}
        </Text>
        <Text className="text-body-lg text-muted-foreground font-body">
          {step === 1
            ? "Choose your role and name"
            : step === 2
              ? "How can we reach you?"
              : "Set a strong password"}
        </Text>
      </View>

      <View className="bg-card p-6 rounded-3xl border border-border gap-5">
        {step === 1 && (
          <View className="gap-5">
            <View>
              <Text className="text-body-sm font-medium text-muted-foreground font-body mb-3">
                I want to
              </Text>
              <View className="flex-row gap-3 bg-background p-1 rounded-2xl border border-border">
                <TouchableOpacity
                  onPress={() => setRole("customer")}
                  className="flex-1 h-12 rounded-xl items-center justify-center flex-row gap-2"
                  style={
                    role === "customer"
                      ? {
                          backgroundColor: "#FFFFFF",
                          borderWidth: 1,
                          borderColor: "#E2E8F0",
                        }
                      : {
                          backgroundColor: "transparent",
                          borderWidth: 1,
                          borderColor: "transparent",
                        }
                  }
                >
                  <FontAwesome5
                    name="shopping-bag"
                    size={14}
                    color={role === "customer" ? "#004CFF" : "#64748B"}
                  />
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
                  style={
                    role === "vendor"
                      ? {
                          backgroundColor: "#FFFFFF",
                          borderWidth: 1,
                          borderColor: "#E2E8F0",
                        }
                      : {
                          backgroundColor: "transparent",
                          borderWidth: 1,
                          borderColor: "transparent",
                        }
                  }
                >
                  <FontAwesome5
                    name="store"
                    size={14}
                    color={role === "vendor" ? "#004CFF" : "#64748B"}
                  />
                  <Text
                    className="font-heading font-semibold"
                    style={{ color: role === "vendor" ? "#004CFF" : "#64748B" }}
                  >
                    Sell
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Input
              label="Full name"
              placeholder="Kofi Mensah"
              autoCapitalize="words"
              value={name}
              onChangeText={(text) => setName(text.replace(/[^a-zA-Z\s\-']/g, ""))}
              error={errors1.name}
              leftIcon={<FontAwesome5 name="user" size={16} color="#94A3B8" solid />}
            />
          </View>
        )}

        {step === 2 && (
          <View className="gap-5">
            <Input
              label="Email address"
              placeholder="you@school.edu.gh"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text.replace(/[^a-zA-Z0-9@._+-]/g, ""));
                setEmailCheckError("");
              }}
              onBlur={handleEmailBlur}
              error={errors2.email || emailCheckError}
              leftIcon={<FontAwesome5 name="envelope" size={16} color="#94A3B8" solid />}
            />

            <Input
              label="Phone number"
              placeholder="024 123 4567"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(text) => {
                setPhone(text.replace(/[^0-9+\s]/g, ""));
                setPhoneCheckError("");
              }}
              onBlur={handlePhoneBlur}
              error={errors2.phone || phoneCheckError}
              leftIcon={<FontAwesome5 name="phone" size={16} color="#94A3B8" solid />}
            />
          </View>
        )}

        {step === 3 && (
          <View className="gap-5">
            <Input
              label="Password"
              placeholder="Min 8 characters"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={errors3.password}
              leftIcon={<FontAwesome5 name="lock" size={16} color="#94A3B8" solid />}
            />

            <Input
              label="Confirm password"
              placeholder="Re-enter your password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors3.confirmPassword}
              leftIcon={<FontAwesome5 name="lock" size={16} color="#94A3B8" solid />}
            />
          </View>
        )}

        {registerMutation.error && step === 3 && (
          <Announcement
            type="error"
            message={registerMutation.error?.message ?? "Registration failed. Please try again."}
          />
        )}

        <View className="w-full mt-2">
          <Button
            title={step === 3 ? "Create Account" : "Continue"}
            size="lg"
            loading={
              (registerMutation.isPending && step === 3) ||
              (checkAvailability.isPending && step === 2)
            }
            onPress={handleNext}
          />
        </View>
      </View>

      <SocialLogins />

      <View className="flex-row justify-center mt-10 gap-2">
        <Text className="text-body-md text-muted-foreground font-body">
          Already have an account?
        </Text>
        <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
          <Text className="text-body-md text-brand-600 font-bold font-body">Sign in</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
