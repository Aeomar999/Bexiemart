import { View } from "react-native";

export default function Index() {
  // Routing logic is handled centrally by app/_layout.tsx, which checks auth state,
  // onboarding state, and waits for the animated splash screen to finish.
  // This component just serves as a mount point so expo-router has a valid index route.
  return <View className="flex-1 bg-white" />;
}