import { View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  variant?: "elevated" | "outlined" | "flat";
  padding?: "sm" | "md" | "none";
}

const variantStyles: Record<string, string> = {
  elevated: "bg-card rounded-[16px] border border-border shadow-none",
  outlined: "bg-card rounded-[16px] border border-border",
  flat: "bg-background rounded-[16px]",
};

const paddingStyles: Record<string, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
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
