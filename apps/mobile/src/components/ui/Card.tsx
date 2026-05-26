import { View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  variant?: "elevated" | "outlined" | "flat";
  padding?: "sm" | "md" | "lg" | "none";
}

const variantStyles: Record<string, string> = {
  elevated: "bg-card rounded-[24px] shadow-[0_10px_20px_rgba(0,0,0,0.05)] border border-border",
  outlined: "bg-card rounded-[24px] border border-border",
  flat: "bg-background rounded-[24px]",
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
    <View
      className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}