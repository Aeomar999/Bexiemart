import React from "react";
import { View, Text, Pressable } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatMoney } from "@/lib/money";
import { displayMoney } from "@/lib/balance";
import { useBalanceVisibility } from "@/lib/stores/balance-visibility-store";

export interface EarningsStatTilesProps {
  today: number;
  thisWeek: number;
  onPress: () => void;
  loading?: boolean;
}

export function EarningsStatTiles({
  today,
  thisWeek,
  onPress,
  loading = false,
}: EarningsStatTilesProps) {
  const hidden = useBalanceVisibility((s) => s.hidden);
  const tiles = [
    { key: "today", label: "Today", value: today },
    { key: "week", label: "This week", value: thisWeek },
  ];

  return (
    <View className="flex-row gap-3">
      {tiles.map((t) => (
        <Pressable
          key={t.key}
          testID={`stat-tile-${t.key}`}
          onPress={onPress}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={
            loading
              ? `${t.label}, loading`
              : hidden
                ? `${t.label}, hidden`
                : `${t.label}, ${formatMoney(t.value)}`
          }
          className="flex-1 bg-card border border-border rounded-xl p-4"
        >
          <Text className="text-caption font-body font-bold text-foreground-secondary">
            {t.label}
          </Text>
          {loading ? (
            <Skeleton width="70%" height={20} borderRadius={6} style={{ marginTop: 6 }} />
          ) : (
            <Text
              className="text-body-lg font-heading font-bold text-foreground mt-1"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {displayMoney(t.value, hidden)}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}
