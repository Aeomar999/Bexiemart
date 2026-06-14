import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import Toast from "@/lib/toast-polyfill";

export default function ContactUsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-[20px] font-heading font-black text-foreground">Contact Us</Text>
        </View>
      </View>
      <ScrollView className="flex-1">
        <View className="px-5 gap-4 pb-12">
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="bg-card p-5 rounded-[24px] border border-border items-center gap-2"
            onPress={() =>
              Linking.openURL("mailto:support@bexiemart.com").catch(() =>
                Toast.show({
                  type: "error",
                  text1: "Email failed",
                  text2: "No email app available",
                })
              )
            }
          >
            <View className="w-12 h-12 bg-primary-subtle rounded-full items-center justify-center">
              <Icon name="mail" size={24} color="var(--color-primary)" />
            </View>
            <Text className="text-heading-sm font-bold text-foreground font-heading">
              Email Support
            </Text>
            <Text className="text-body-md text-muted-foreground font-body">
              support@bexiemart.com
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="bg-card p-5 rounded-[24px] border border-border items-center gap-2"
            onPress={() =>
              Linking.openURL("tel:+233241234567").catch(() =>
                Toast.show({ type: "error", text1: "Call failed", text2: "No phone app available" })
              )
            }
          >
            <View className="w-12 h-12 bg-emerald-100 rounded-full items-center justify-center">
              <Icon name="phone" size={24} color="#10b981" />
            </View>
            <Text className="text-heading-sm font-bold text-foreground font-heading">Call Us</Text>
            <Text className="text-body-md text-muted-foreground font-body">+233 24 123 4567</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
