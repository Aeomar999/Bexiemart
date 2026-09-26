import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatMoney } from "@/lib/money";
import { displayMoney } from "@/lib/balance";
import { useThemeColors } from "@/theme/useThemeColors";
import { useBalanceVisibility } from "@/lib/stores/balance-visibility-store";

export interface BalanceCardProps {
  label: string;
  available: number;
  held?: { label: string; amount: number; info: string };
  action?: { title: string; icon: string; onPress: () => void };
  onPress?: () => void;
  pressHint?: string;
  status?: "loading" | "error" | "ready";
  onRetry?: () => void;
  size?: "md" | "sm";
  testID?: string;
}

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };
const TABULAR = { fontVariant: ["tabular-nums" as const] };

function summaryLabel(
  label: string,
  available: number,
  held: BalanceCardProps["held"],
  hidden: boolean
): string {
  if (hidden) return `${label}, hidden.`;
  const main = `${label}, ${formatMoney(available)}.`;
  return held ? `${main} ${held.label}, ${formatMoney(held.amount)}.` : main;
}

function SplitBar({
  available,
  held,
  hidden,
  testID,
}: {
  available: number;
  held: number;
  hidden: boolean;
  testID: string;
}) {
  if (hidden || (!(available > 0) && !(held > 0))) {
    return (
      <View
        testID={`${testID}-bar-empty`}
        className="rounded-full bg-border"
        style={{ height: 6 }}
      />
    );
  }
  return (
    <View className="flex-row gap-0.5" style={{ height: 6 }}>
      {available > 0 && (
        <View
          testID={`${testID}-bar-available`}
          className="rounded-full bg-primary"
          style={{ flex: available }}
        />
      )}
      {held > 0 && (
        <View
          testID={`${testID}-bar-held`}
          className="rounded-full bg-money-held"
          style={{ flex: held }}
        />
      )}
    </View>
  );
}

function LegendRow({
  dotClass,
  label,
  value,
  info,
}: {
  dotClass: string;
  label: string;
  value: string;
  info?: { open: boolean; onToggle: () => void; text: string; testID: string; color: string };
}) {
  return (
    <View className="py-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1">
          <View className={`w-2 h-2 rounded-full ${dotClass}`} />
          <Text className="text-body-sm font-body text-foreground-secondary">{label}</Text>
          {info && (
            <Pressable
              testID={`${info.testID}-info`}
              onPress={info.onToggle}
              hitSlop={HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel={`What is ${label}?`}
              accessibilityState={{ expanded: info.open }}
            >
              <Icon name="info" size={14} color={info.color} />
            </Pressable>
          )}
        </View>
        <Text className="text-body-sm font-body font-bold text-foreground" style={TABULAR}>
          {value}
        </Text>
      </View>
      {info?.open && (
        <View className="mt-2 rounded-lg bg-primary-subtle px-3 py-2">
          <Text className="text-body-sm font-body text-foreground">{info.text}</Text>
        </View>
      )}
    </View>
  );
}

export function BalanceCard({
  label,
  available,
  held,
  action,
  onPress,
  pressHint,
  status = "ready",
  onRetry,
  size = "md",
  testID = "balance-card",
}: BalanceCardProps) {
  const colors = useThemeColors();
  const hidden = useBalanceVisibility((s) => s.hidden);
  const toggleHidden = useBalanceVisibility((s) => s.toggle);
  const [infoOpen, setInfoOpen] = useState(false);
  const compact = size === "sm";

  const header = (
    <View className="flex-row items-center justify-between">
      <Text
        className="text-caption font-body font-bold text-foreground-secondary"
        importantForAccessibility="no"
        accessibilityElementsHidden
      >
        {label}
      </Text>
      <Pressable
        testID={`${testID}-toggle`}
        onPress={toggleHidden}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={hidden ? "Show balances" : "Hide balances"}
      >
        <Icon name={hidden ? "eye-off" : "eye"} size={18} color={colors.textSecondary} />
      </Pressable>
    </View>
  );

  const loadingBody = (
    <View
      testID={`${testID}-loading`}
      accessible
      accessibilityLabel="Loading balance"
      className="mt-2 gap-3"
    >
      <Skeleton width="60%" height={compact ? 28 : 36} borderRadius={8} />
      {held && <Skeleton height={6} borderRadius={3} />}
      {held && !compact && <Skeleton width="80%" height={14} />}
      {held && !compact && <Skeleton width="70%" height={14} />}
      {action && !compact && <Skeleton height={48} borderRadius={24} />}
    </View>
  );

  const errorBody = (
    <View testID={`${testID}-error`} className="mt-3 gap-3">
      <View className="flex-row items-start gap-2">
        <Icon name="alert-circle" size={18} color={colors.error} />
        <View className="flex-1">
          <Text className="text-body-md font-body font-bold text-foreground">
            Couldn't load your balance
          </Text>
          <Text className="text-body-sm font-body text-foreground-secondary mt-1">
            Your money is safe. Check your connection and try again.
          </Text>
        </View>
      </View>
      {onRetry && (
        <Button
          title="Retry"
          variant="outline"
          size="sm"
          onPress={onRetry}
          testID={`${testID}-retry`}
          leftIcon={<Icon name="refresh-cw" size={16} color={colors.primary} />}
        />
      )}
    </View>
  );

  const readyBody = (
    <>
      <View
        testID={`${testID}-summary`}
        accessible
        accessibilityLabel={summaryLabel(label, available, held, hidden)}
        className={compact ? "mt-1 mb-3" : "mt-1 mb-4"}
      >
        <View className="flex-row items-baseline gap-1">
          <Text className="text-body-lg font-heading font-bold text-primary">GHS</Text>
          <Text
            testID={`${testID}-amount`}
            className={`${compact ? "text-display-md" : "text-money-secondary"} font-heading font-black text-primary`}
            style={TABULAR}
          >
            {hidden ? "••••••" : formatMoney(available, "")}
          </Text>
        </View>
      </View>

      {held && (
        <SplitBar available={available} held={held.amount} hidden={hidden} testID={testID} />
      )}

      {held && compact && (
        <View className="flex-row items-center justify-between mt-3">
          <Text className="text-body-sm font-body text-foreground-secondary">{held.label}</Text>
          <Text className="text-body-sm font-body font-bold text-foreground" style={TABULAR}>
            {displayMoney(held.amount, hidden)}
          </Text>
        </View>
      )}

      {held && !compact && (
        <View className="mt-2">
          <LegendRow
            dotClass="bg-primary"
            label="Available"
            value={displayMoney(available, hidden)}
          />
          <View className="border-t border-border">
            <LegendRow
              dotClass="bg-money-held"
              label={held.label}
              value={displayMoney(held.amount, hidden)}
              info={{
                open: infoOpen,
                onToggle: () => setInfoOpen((o) => !o),
                text: held.info,
                testID,
                color: colors.primary,
              }}
            />
          </View>
        </View>
      )}

      {action && !compact && (
        <Button
          title={action.title}
          onPress={action.onPress}
          className="mt-4"
          testID={`${testID}-action`}
          leftIcon={<Icon name={action.icon} size={18} color={colors.primaryText} />}
        />
      )}

      {compact && onPress && pressHint && (
        <Pressable
          testID={`${testID}-hint`}
          onPress={onPress}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel={pressHint}
          className="flex-row items-center justify-end gap-1 mt-3"
        >
          <Text className="text-body-sm font-body font-bold text-primary">{pressHint}</Text>
          <Icon name="chevron-right" size={16} color={colors.primary} />
        </Pressable>
      )}
    </>
  );

  const body = status === "loading" ? loadingBody : status === "error" ? errorBody : readyBody;
  const containerClass = `bg-card border border-border rounded-2xl ${compact ? "p-4" : "p-5"}`;

  if (onPress) {
    // accessible={false} keeps the eye toggle and the hint focusable for
    // screen readers; touch users can still tap anywhere on the card.
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        accessible={false}
        className={containerClass}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        {header}
        {body}
      </Pressable>
    );
  }

  return (
    <View testID={testID} className={containerClass}>
      {header}
      {body}
    </View>
  );
}
