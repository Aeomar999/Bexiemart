import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVendorCustomers } from "@/lib/hooks/use-vendor-customers";
import { Icon } from "@/components/ui/Icon";
import { ListSkeleton } from "@/components/ui/Skeleton";

export default function VendorCustomersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: customers = [], isLoading } = useVendorCustomers();

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center justify-between"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center">
          <BackButton className="mr-3" />
          <Text className="text-[20px] font-heading font-black text-foreground">Top Customers</Text>
        </View>
        <View className="bg-muted px-3 py-1.5 rounded-full">
          <Text className="text-[12px] font-bold text-muted-foreground">89 Total</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View className="bg-card rounded-[20px] border border-border p-2 flex-row items-center mb-6">
          <Icon
            name="search"
            size={20}
            color="#94a3b8"
            style={{ marginLeft: 12, marginRight: 8 }}
          />
          <TextInput placeholder="Search customers..." className="flex-1 h-10 text-[15px]" />
        </View>

        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ListSkeleton />
          </View>
        ) : (
          <View className="gap-3">
            {customers.map((customer: any) => (
              <View key={customer.id} className="bg-card rounded-[20px] border border-border p-4">
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-row items-center">
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center mr-4"
                      style={{ backgroundColor: customer.bg }}
                    >
                      <Text
                        className="text-[16px] font-heading font-black"
                        style={{ color: customer.color }}
                      >
                        {customer.initials}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-[16px] font-bold text-foreground mb-0.5">
                        {customer.name}
                      </Text>
                      <Text className="text-[13px] text-muted-foreground">
                        Last order {customer.lastOrder}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row bg-background rounded-[12px] p-3 mb-4">
                  <View className="flex-1 border-r border-border">
                    <Text className="text-[12px] text-muted-foreground mb-1">Total Spend</Text>
                    <Text className="text-[14px] font-bold text-foreground">{customer.spend}</Text>
                  </View>
                  <View className="flex-1 pl-4">
                    <Text className="text-[12px] text-muted-foreground mb-1">Total Orders</Text>
                    <Text className="text-[14px] font-bold text-foreground">{customer.orders}</Text>
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <Pressable
                    className="flex-1 py-2.5 rounded-[12px] border border-border items-center justify-center flex-row"
                    onPress={() => router.push("/(vendor)/(orders)")}
                  >
                    <Icon
                      name="shopping-bag"
                      size={16}
                      color="#64748b"
                      style={{ marginRight: 6 }}
                    />
                    <Text className="text-[13px] font-bold text-muted-foreground">View Orders</Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 py-2.5 rounded-[12px] bg-brand-50 items-center justify-center flex-row"
                    onPress={() => router.push(`/(vendor)/inbox/msg_${customer.id}`)}
                  >
                    <Icon
                      name="message-circle"
                      size={16}
                      color="#004CFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text className="text-[13px] font-bold text-brand-600">Message</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
