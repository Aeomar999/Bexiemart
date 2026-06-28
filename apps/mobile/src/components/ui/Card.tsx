import { View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  variant?: "elevated" | "outlined" | "flat";
  padding?: "sm" | "md" | "lg" | "none";
}

const variantStyles: Record<string, string> = {
  elevated: "bg-card rounded-2xl shadow-lg border border-border",
  outlined: "bg-card rounded-2xl border border-border",
  flat: "bg-background rounded-2xl",
};

const paddingStyles: Record<string, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  variant = "elevated",
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <View className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className}`} {...props}>
      {children}
    </View>
  );
}
