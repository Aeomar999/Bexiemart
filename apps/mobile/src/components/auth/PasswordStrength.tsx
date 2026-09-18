import React from "react";
import { View, Text } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Tick01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { tokens } from "@/theme/tokens";

interface PasswordStrengthProps {
  password?: string;
}

export function PasswordStrength({ password = "" }: PasswordStrengthProps) {
  const requirements = [
    { label: "At least 8 characters", isMet: password.length >= 8 },
    { label: "One uppercase letter", isMet: /[A-Z]/.test(password) },
    { label: "One lowercase letter", isMet: /[a-z]/.test(password) },
    { label: "One number", isMet: /[0-9]/.test(password) },
    { label: "One special character", isMet: /[^A-Za-z0-9]/.test(password) },
  ];

  const metCount = requirements.filter((r) => r.isMet).length;

  let strengthLabel = "Weak";
  let barColor = tokens.error;
  if (metCount === requirements.length) {
    strengthLabel = "Strong";
    barColor = tokens.success;
  } else if (metCount >= 3) {
    strengthLabel = "Good";
    barColor = tokens.warning;
  }

  const progress = Math.max(0, (metCount / requirements.length) * 100);

  if (password.length === 0) {
    return null;
  }

  return (
    <View className="mt-3 gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-body-sm font-semibold font-body text-foreground">
          Password Strength
        </Text>
        <Text className="text-body-sm font-bold font-body" style={{ color: barColor }}>
          {strengthLabel}
        </Text>
      </View>

      {/* Progress Bar */}
      <View className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <View
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, backgroundColor: barColor }}
        />
      </View>

      {/* Checklist */}
      <View className="gap-2 mt-1">
        {requirements.map((req, index) => (
          <View key={index} className="flex-row items-center gap-2">
            <HugeiconsIcon
              icon={req.isMet ? Tick01Icon : Cancel01Icon}
              size={14}
              color={req.isMet ? tokens.success : tokens.textMuted}
            />
            <Text
              className={`text-caption font-body ${
                req.isMet ? "text-success" : "text-muted-foreground"
              }`}
            >
              {req.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
