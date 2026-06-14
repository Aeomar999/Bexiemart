import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../../src/components/ui/Icon";

function TabIcon({ name, color }: { name: string; color: string }) {
  return <Icon name={name} color={color} size={24} />;
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
              options.tabBarIcon({ color: isFocused ? "var(--color-primary)" : "#94A3B8" })}
            {isFocused && (
              <Text
                style={{
                  color: "var(--color-primary)",
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

export default function VendorLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: "Raleway",
          fontSize: 20,
          fontWeight: "700",
          color: "#1E293B",
        },
      }}
    >
      <Tabs.Screen
        name="(dashboard)"
        options={{
          title: "Dashboard",
          headerTitle: "BexieMart Vendor",
          tabBarIcon: ({ color }) => <TabIcon name="grid" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(products)"
        options={{
          title: "Listings",
          headerTitle: "My Listings",
          tabBarIcon: ({ color }) => <TabIcon name="package" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(orders)"
        options={{
          title: "Orders",
          headerTitle: "Orders",
          tabBarIcon: ({ color }) => <TabIcon name="shopping-cart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(earnings)"
        options={{
          title: "Earnings",
          headerTitle: "Earnings",
          tabBarIcon: ({ color }) => <TabIcon name="dollar-sign" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(settings)"
        options={{
          title: "Settings",
          headerTitle: "Settings",
          tabBarIcon: ({ color }) => <TabIcon name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
