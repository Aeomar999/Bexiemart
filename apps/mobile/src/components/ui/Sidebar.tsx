import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { tokens } from "@/theme/tokens";
import { Icon } from "./Icon";
import { useCartStore } from "@/lib/stores/cart-store";
import { Badge } from "./Badge";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SidebarProps {
  role?: "customer" | "vendor" | "dispatcher";
}

export function Sidebar({ role = "customer" }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const itemCount = useCartStore((s) => s.itemCount);

  let tabs: Array<{ name: string; title: string; icon: any; path: any; badge?: number }> = [];

  if (role === "customer") {
    tabs = [
      { name: "(home)", title: "Home", icon: "home", path: "/(customer)/(tabs)/(home)" },
      { name: "(shop)", title: "Shop", icon: "grid", path: "/(customer)/(tabs)/(shop)" },
      { name: "reels", title: "Reels", icon: "video", path: "/(customer)/(tabs)/reels" },
      {
        name: "cart",
        title: "Cart",
        icon: "shopping-bag",
        path: "/(customer)/(tabs)/cart",
        badge: itemCount,
      },
      { name: "profile", title: "Profile", icon: "user", path: "/(customer)/(tabs)/profile" },
    ];
  } else if (role === "vendor") {
    tabs = [
      { name: "(dashboard)", title: "Dashboard", icon: "grid", path: "/(vendor)/(dashboard)" },
      { name: "(products)", title: "Listings", icon: "package", path: "/(vendor)/(products)" },
      { name: "(orders)", title: "Orders", icon: "shopping-cart", path: "/(vendor)/(orders)" },
      { name: "(earnings)", title: "Earnings", icon: "dollar-sign", path: "/(vendor)/(earnings)" },
      { name: "(settings)", title: "Settings", icon: "settings", path: "/(vendor)/(settings)" },
    ];
  } else if (role === "dispatcher") {
    tabs = [
      { name: "(home)", title: "Map", icon: "map", path: "/(dispatcher)/(tabs)/(home)" },
      { name: "tasks", title: "Tasks", icon: "list", path: "/(dispatcher)/(tabs)/tasks" },
      {
        name: "(earnings)",
        title: "Earnings",
        icon: "dollar-sign",
        path: "/(dispatcher)/(tabs)/(earnings)",
      },
      { name: "profile", title: "Profile", icon: "user", path: "/(dispatcher)/(tabs)/profile" },
    ];
  }

  return (
    <View
      style={{
        width: 280,
        backgroundColor: tokens.surface,
        borderRightWidth: 1,
        borderRightColor: tokens.background,
        paddingTop: insets.top + 32,
        paddingBottom: insets.bottom + 32,
        height: "100%",
      }}
    >
      <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: tokens.primary,
            fontFamily: "Raleway_700Bold",
          }}
        >
          BexieMart
        </Text>
      </View>
      <ScrollView>
        {tabs.map((tab) => {
          // A rudimentary way to check if current path starts with or equals the tab path
          const isFocused =
            pathname === tab.path ||
            pathname.startsWith(tab.path + "/") ||
            (pathname.startsWith("/(customer)/(tabs)") &&
              tab.name === "(home)" &&
              tab.path === "/(customer)/(tabs)/(home)");

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => router.push(tab.path)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                paddingHorizontal: 24,
                backgroundColor: isFocused ? tokens.primarySubtle : "transparent",
                borderRightWidth: isFocused ? 4 : 0,
                borderRightColor: tokens.primary,
              }}
            >
              <View style={{ position: "relative" }}>
                <Icon
                  name={tab.icon}
                  color={isFocused ? tokens.primary : tokens.textMuted}
                  size={24}
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <Badge count={tab.badge} variant="count" />
                )}
              </View>
              <Text
                style={{
                  marginLeft: 16,
                  fontSize: 16,
                  fontFamily: isFocused ? "Nunito_700Bold" : "Nunito_500Medium",
                  color: isFocused ? tokens.primary : tokens.text,
                }}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
