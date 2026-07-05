import { tokens } from "@/theme/tokens";
import { Tabs } from "expo-router";
import { View, Text, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCartStore } from "@/lib/stores/cart-store";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";

function TabIcon({ name, color }: { name: string; color: string }) {
  return <Icon name={name} color={color} size={24} />;
}

function CartTabIcon({ color }: { color: string }) {
  const itemCount = useCartStore((s) => s.itemCount);
  return (
    <View>
      <Icon name="shopping-bag" color={color} size={24} />
      <Badge count={itemCount} />
    </View>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingBottom: insets.bottom + 16,
        paddingTop: 16,
        paddingHorizontal: 20,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#F8FAFC",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
      }}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];

        if (options.href === null || !options.tabBarIcon) return null;

        const isFocused = state.index === index;
        const label = options.title !== undefined ? options.title : route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: isFocused }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 9999,
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: isFocused ? "#eff6ff" : "transparent",
            }}
          >
            {options.tabBarIcon &&
              options.tabBarIcon({ color: isFocused ? tokens.primary : "#94A3B8" })}
            {isFocused && (
              <Text
                style={{
                  color: tokens.primary,
                  fontWeight: "bold",
                  fontSize: 14,
                  marginLeft: 8,
                }}
              >
                {label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(shop)"
        options={{
          title: "Shop",
          tabBarIcon: ({ color }) => <TabIcon name="grid" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          title: "Reels",
          tabBarIcon: ({ color }) => <TabIcon name="video" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color }) => <CartTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
