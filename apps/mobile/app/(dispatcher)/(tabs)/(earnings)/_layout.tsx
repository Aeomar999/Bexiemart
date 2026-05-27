import { Stack } from "expo-router";

export default function EarningsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F8FAFC" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="withdraw" />
    </Stack>
  );
}
