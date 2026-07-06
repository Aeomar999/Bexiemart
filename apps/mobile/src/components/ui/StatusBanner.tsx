import { View, Text, Pressable } from "react-native";
import { tokens } from "@/theme/tokens";
import { Icon } from "./Icon";

export type StatusBannerVariant = "primary" | "neutral" | "critical";

interface StatusBannerProps {
  /** Feather icon shown in the leading circle. */
  icon: string;
  title: string;
  subtitle?: string;
  /** Trailing pill label (e.g. "Track", "View"). Omit for no action. */
  actionLabel?: string;
  /** Makes the whole banner tappable. */
  onPress?: () => void;
  variant?: StatusBannerVariant;
  /** Wrapper className for host-screen spacing (e.g. "px-5 mt-6"). */
  className?: string;
}

const VARIANTS: Record<
  StatusBannerVariant,
  {
    wrap: string;
    iconCircle: string;
    iconColor: string;
    title: string;
    subtitle: string;
    pill: string;
    pillText: string;
  }
> = {
  primary: {
    wrap: "bg-primary border-primary-hover",
    iconCircle: "bg-card/20",
    iconColor: "#ffffff",
    title: "text-white",
    subtitle: "text-white/80",
    pill: "bg-card/20",
    pillText: "text-white",
  },
  neutral: {
    wrap: "bg-card border-border",
    iconCircle: "bg-primary-subtle",
    iconColor: tokens.primary,
    title: "text-foreground",
    subtitle: "text-muted-foreground",
    pill: "bg-primary-subtle",
    pillText: "text-primary",
  },
  critical: {
    wrap: "bg-error border-error",
    iconCircle: "bg-card/20",
    iconColor: "#ffffff",
    title: "text-white",
    subtitle: "text-white/80",
    pill: "bg-card/20",
    pillText: "text-white",
  },
};

/**
 * Reusable live-status / notification banner (delivery in progress, upcoming
 * appointment, etc.). Consolidates the icon-circle + title/subtitle + action
 * pill pattern that was copy-pasted across screens.
 */
export function StatusBanner({
  icon,
  title,
  subtitle,
  actionLabel,
  onPress,
  variant = "primary",
  className,
}: StatusBannerProps) {
  const v = VARIANTS[variant];

  const content = (
    <View className={`${v.wrap} rounded-2xl p-4 flex-row items-center justify-between border`}>
      <View className="flex-row items-center gap-3 flex-1">
        <View className={`w-10 h-10 ${v.iconCircle} rounded-full items-center justify-center`}>
          <Icon name={icon} size={20} color={v.iconColor} />
        </View>
        <View className="flex-1">
          <Text className={`${v.title} font-bold font-heading text-body-lg`}>{title}</Text>
          {subtitle ? (
            <Text className={`${v.subtitle} font-body text-body-sm mt-0.5`}>{subtitle}</Text>
          ) : null}
        </View>
      </View>

      {actionLabel ? (
        <View className={`${v.pill} px-3 py-1.5 rounded-full`}>
          <Text className={`${v.pillText} font-bold text-body-sm`}>{actionLabel}</Text>
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        className={className}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return <View className={className}>{content}</View>;
}
