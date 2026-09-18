import { View, Text, TextInput, type TextInputProps, TouchableOpacity } from "react-native";
import { useState, forwardRef } from "react";
import { tokens } from "@/theme/tokens";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      secureTextEntry,
      className = "",
      editable = true,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isSecureVisible, setIsSecureVisible] = useState(false);

    return (
      <View className="gap-2">
        {label && (
          <Text className="text-body-sm font-semibold text-muted-foreground font-body ml-2">
            {label}
          </Text>
        )}

        <View
          className={`flex-row items-center gap-3 px-4 h-12 rounded-xl border ${isFocused ? "border-primary bg-background" : "border-border bg-background"} ${error ? "border-error bg-error-light/30" : ""} ${!editable ? "bg-muted" : ""}`}
        >
          {leftIcon}
          <TextInput
            ref={ref}
            className={`flex-1 font-body text-body-md text-foreground ${!editable ? "text-muted-foreground" : ""} ${className}`}
            placeholderTextColor={tokens.textMuted}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            secureTextEntry={secureTextEntry && !isSecureVisible}
            editable={editable}
            accessibilityLabel={props.accessibilityLabel || label || props.placeholder}
            accessibilityRole={props.accessibilityRole || "text"}
            accessibilityState={{ disabled: !editable, ...props.accessibilityState }}
            {...props}
          />
          {secureTextEntry && (
            <TouchableOpacity
              onPress={() => setIsSecureVisible(!isSecureVisible)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={isSecureVisible ? "Hide password" : "Show password"}
            >
              <HugeiconsIcon
                icon={isSecureVisible ? ViewOffIcon : ViewIcon}
                size={20}
                color={tokens.textMuted}
              />
            </TouchableOpacity>
          )}
          {rightIcon}
        </View>

        {hint && !error && (
          <Text className="text-caption text-muted-foreground font-body ml-2">{hint}</Text>
        )}
        {error && <Text className="text-caption text-error font-body ml-2">{error}</Text>}
      </View>
    );
  }
);

Input.displayName = "Input";
