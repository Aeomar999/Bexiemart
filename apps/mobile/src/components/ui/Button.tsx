import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  type TouchableOpacityProps,
} from "react-native";
import { forwardRef } from "react";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  textClassName?: string;
}

const variantStyles: Record<string, string> = {
  primary: "bg-primary active:bg-primary-active",
  secondary: "bg-secondary active:bg-secondary-hover",
  outline: "bg-transparent border border-border active:bg-muted",
  ghost: "bg-transparent active:bg-muted",
  danger: "bg-error active:opacity-80",
};

const textColors: Record<string, string> = {
  primary: "text-primary-text",
  secondary: "text-secondary-text",
  outline: "text-foreground",
  ghost: "text-primary",
  danger: "text-white",
};

const sizeStyles: Record<string, string> = {
  sm: "h-10 px-5 rounded-full",
  md: "h-12 px-6 rounded-full",
  lg: "h-14 px-8 rounded-full",
};

const textSizes: Record<string, string> = {
  sm: "text-sm",
  md: "text-body-lg",
  lg: "text-body-lg",
};

export const Button = forwardRef<View, ButtonProps>(
  (
    {
      title,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      leftIcon,
      className = "",
      textClassName = "",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <TouchableOpacity
        ref={ref}
        activeOpacity={0.92}
        disabled={isDisabled}
        className={`
          flex-row items-center justify-center gap-2
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${isDisabled ? "opacity-50" : "active:scale-[0.98]"}
          ${className}
        `}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        {...props}
      >
        {loading ? (
          <ActivityIndicator
            color={
              variant === "outline" || variant === "ghost"
                ? "var(--color-primary)"
                : "var(--color-primary-text)"
            }
            size="small"
          />
        ) : (
          <>
            {leftIcon}
            <Text
              className={`
                font-heading font-semibold
                ${textColors[variant]}
                ${textSizes[size]}
                ${textClassName}
              `}
            >
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = "Button";
