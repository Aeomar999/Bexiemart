import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { tokens } from "@/theme/tokens";
import { toMinor, toMajor, toEditString, formatMoney, sanitizeInput } from "@/lib/money";

export interface MoneyInputProps {
  value: number;
  onChangeValue: (value: number) => void;
  currency?: string;
  placeholder?: string;
  balance?: number;
  quickAmounts?: number[];
  feeCalc?: (value: number) => number;
  mode?: "input" | "display";
  size?: "lg" | "md";
  align?: "left" | "center";
  min?: number;
  max?: number;
  editable?: boolean;
  autoFocus?: boolean;
  label?: string;
  error?: string;
  testID?: string;
}

export function MoneyInput({
  value,
  onChangeValue,
  currency = "GHS",
  placeholder = "0.00",
  balance,
  quickAmounts,
  feeCalc,
  mode = "input",
  size = "lg",
  align = "left",
  min,
  max,
  editable = true,
  autoFocus,
  label,
  error,
  testID,
}: MoneyInputProps) {
  const [text, setText] = useState(() => toEditString(value));

  useEffect(() => {
    if (toMinor(text) !== toMinor(value)) {
      setText(toEditString(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const curCls = size === "lg" ? "text-display-sm" : "text-body-lg";
  const amtCls = size === "lg" ? "text-display-lg" : "text-display-sm";

  if (mode === "display") {
    return (
      <View
        className={`flex-row items-center gap-2 py-2 ${align === "center" ? "justify-center" : ""}`}
      >
        <Text className={`font-heading font-bold text-foreground ${curCls}`}>{currency}</Text>
        <Text className={`font-heading font-black text-foreground ${amtCls}`} testID={testID}>
          {formatMoney(value, "")}
        </Text>
      </View>
    );
  }

  const insufficient = typeof balance === "number" && toMinor(value) > toMinor(balance);
  const belowMin = typeof min === "number" && value > 0 && toMinor(value) < toMinor(min);
  const message =
    error ??
    (insufficient ? "Insufficient balance" : belowMin ? `Minimum ${formatMoney(min!)}` : "");
  const hasError = !!message;

  const handleChange = (raw: string) => {
    const clean = sanitizeInput(raw);
    if (typeof max === "number" && toMinor(clean) > toMinor(max)) return;
    setText(clean);
    onChangeValue(toMajor(toMinor(clean)));
  };

  return (
    <View>
      {label ? (
        <Text className="text-body-md font-bold text-muted-foreground font-heading mb-2 ml-1">
          {label}
        </Text>
      ) : null}

      <View
        className={`flex-row items-center gap-2 rounded-2xl border bg-background ${size === "lg" ? "p-4" : "px-4 py-3"} ${hasError ? "border-error" : "border-border"} ${align === "center" ? "justify-center" : ""}`}
      >
        <Text className={`font-heading font-bold text-foreground ${curCls}`}>{currency}</Text>
        <TextInput
          testID={testID}
          value={text}
          onChangeText={handleChange}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={tokens.textDisabled}
          editable={editable}
          autoFocus={autoFocus}
          accessibilityLabel={`Amount in ${currency}`}
          className={`font-heading font-black text-foreground p-0 ${amtCls} ${align === "center" ? "text-center" : "flex-1"}`}
        />
      </View>

      <View className="min-h-[20px] mt-2">
        {message ? (
          <Text className="text-caption font-bold text-error font-body ml-1">{message}</Text>
        ) : null}
      </View>

      {quickAmounts && quickAmounts.length > 0 ? (
        <View className="flex-row flex-wrap gap-3 mt-1">
          {quickAmounts.map((amt) => {
            const active = toMinor(value) === toMinor(amt);
            return (
              <Pressable
                key={amt}
                onPress={() => onChangeValue(amt)}
                accessibilityRole="button"
                accessibilityLabel={`Add ${amt} ${currency}`}
                accessibilityState={{ selected: active }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className={`rounded-2xl border px-4 py-3 ${active ? "border-primary bg-primary-subtle" : "border-border bg-card"}`}
              >
                <Text
                  className={`text-body-sm font-bold ${active ? "text-primary" : "text-muted-foreground"}`}
                >
                  +{amt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {feeCalc ? renderBreakdown(value, feeCalc(value > 0 ? value : 0) || 0) : null}
    </View>
  );
}

function renderBreakdown(amount: number, fee: number) {
  const feeShown = amount > 0 ? fee : 0;
  return (
    <View className="mt-4 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row justify-between py-1">
        <Text className="text-body-sm text-muted-foreground font-body">Amount</Text>
        <Text className="text-body-sm font-bold text-foreground">{formatMoney(amount)}</Text>
      </View>
      <View className="flex-row justify-between py-1">
        <Text className="text-body-sm text-muted-foreground font-body">Fee</Text>
        <Text className="text-body-sm font-bold text-foreground">{formatMoney(feeShown)}</Text>
      </View>
      <View className="flex-row justify-between pt-2 mt-1 border-t border-border">
        <Text className="text-body-md font-bold text-foreground">Total</Text>
        <Text className="text-body-md font-black text-foreground">
          {formatMoney(amount + feeShown)}
        </Text>
      </View>
    </View>
  );
}
