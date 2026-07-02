import React, { useRef } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";

export interface SegmentedOtpInputProps {
  code: string;
  onChangeCode: (code: string) => void;
  status?: "sending" | "idle" | "verifying" | "success" | "error";
  disabled?: boolean;
}

/**
 * Agency-grade Segmented OTP Input component for BexieMart mobile app.
 * Chunks the 6-digit code into two groups of 3 with hardware squircle bezels
 * and a clean en-dash separator for effortless readability.
 */
export const SegmentedOtpInput: React.FC<SegmentedOtpInputProps> = ({
  code,
  onChangeCode,
  status = "idle",
  disabled = false,
}) => {
  const inputRef = useRef<TextInput>(null);

  const handleContainerPress = () => {
    if (!disabled && status !== "verifying" && status !== "sending") {
      inputRef.current?.focus();
    }
  };

  const getBezelStyle = (index: number) => {
    const isCurrent = code.length === index && !disabled && status !== "verifying";
    const isFilled = Boolean(code[index]);
    const isError = status === "error";

    if (isCurrent) {
      return "border-primary bg-primary/10 border-2 shadow-sm";
    }
    if (isError) {
      return isFilled ? "border-error bg-error/10 border" : "border-error/40 bg-error/5 border";
    }
    if (isFilled) {
      return "border-foreground/25 bg-card border shadow-sm";
    }
    return "border-border/60 bg-muted/30 border";
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleContainerPress}
      className="w-full items-center justify-center my-6"
    >
      <View className="flex-row items-center justify-center w-full relative">
        {/* Left Segment: Digits 1-3 */}
        <View className="flex-row gap-2.5">
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              pointerEvents="none"
              className={`w-12 h-14 rounded-xl items-center justify-center ${getBezelStyle(i)}`}
            >
              <Text
                className={`text-display-sm font-heading font-black ${
                  status === "error" ? "text-error" : "text-foreground"
                }`}
              >
                {code[i] || ""}
              </Text>
            </View>
          ))}
        </View>

        {/* Center Divider */}
        <View className="mx-3 items-center justify-center">
          <Text className="text-xl font-bold text-muted-foreground/60">–</Text>
        </View>

        {/* Right Segment: Digits 4-6 */}
        <View className="flex-row gap-2.5">
          {[3, 4, 5].map((i) => (
            <View
              key={i}
              pointerEvents="none"
              className={`w-12 h-14 rounded-xl items-center justify-center ${getBezelStyle(i)}`}
            >
              <Text
                className={`text-display-sm font-heading font-black ${
                  status === "error" ? "text-error" : "text-foreground"
                }`}
              >
                {code[i] || ""}
              </Text>
            </View>
          ))}
        </View>

        {/* Invisible TextInput covering the whole area */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={onChangeCode}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={6}
          autoFocus={!disabled}
          editable={!disabled && status !== "verifying" && status !== "sending"}
          className="absolute w-full h-full opacity-0"
          caretHidden={true}
        />
      </View>
    </TouchableOpacity>
  );
};
