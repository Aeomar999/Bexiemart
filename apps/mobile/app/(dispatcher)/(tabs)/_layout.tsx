import { tokens } from "@/theme/tokens";
import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";

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
          title: "Map",
          tabBarIcon: ({ color }) => <TabIcon name="map" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color }) => <TabIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(earnings)"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color }) => <TabIcon name="dollar-sign" color={color} />,
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
