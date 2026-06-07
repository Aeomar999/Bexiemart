import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, Switch, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";
import {
  useVendorCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
  useToggleCoupon,
} from "@/lib/hooks/use-vendor-coupons";
import { DetailSkeleton } from "@/components/ui/Skeleton";

export default function VendorPromotionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: coupons, isLoading } = useVendorCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const toggleCoupon = useToggleCoupon();

  const [isModalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [value, setValue] = useState("");
  const [type, setType] = useState("Discount");

  const openCreate = () => {
    setEditingId(null);
    setCode("");
    setValue("");
    setType("Discount");
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!code || !value) {
      Alert.alert("Required", "Code and value are required.");
      return;
    }
    if (editingId) {
      updateCoupon.mutate({ id: editingId, code, value, type });
    } else {
      createCoupon.mutate({ code, value, type });
    }
    setModalVisible(false);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center justify-between"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center">
          <BackButton className="mr-3" />
          <Text className="text-[20px] font-heading font-black text-foreground">Promotions</Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <DetailSkeleton />
        </View>
      ) : (
        <ScrollView className="flex-1 px-5 pt-6 pb-12">
          {/* Flash Sales Opt-in */}
          <View className="bg-brand-600 rounded-[20px] p-5 mb-8 relative overflow-hidden">
            <View className="absolute top-0 right-0 w-32 h-32 bg-card/10 rounded-full -mr-10 -mt-10" />
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Icon name="zap" size={20} color="#fcd34d" style={{ marginRight: 8 }} />
                <Text className="text-[18px] font-heading font-black text-white">
                  BexieMart Flash Sales
                </Text>
              </View>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ false: "rgba(255,255,255,0.3)", true: "#10b981" }}
                thumbColor={"#ffffff"}
              />
            </View>
            <Text className="text-[14px] text-white/80 leading-relaxed">
              Opt-in to platform-wide flash sales. BexieMart will automatically apply a 15% discount
              to your top products during flash sale hours.
            </Text>
          </View>

          {/* Custom Coupons */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[18px] font-bold text-foreground">Store Coupons</Text>
            <Pressable
              onPress={openCreate}
              className="bg-brand-50 px-3 py-1.5 rounded-full flex-row items-center"
            >
              <Icon name="plus" size={14} color="#004CFF" style={{ marginRight: 4 }} />
              <Text className="text-[12px] font-bold text-brand-600">Create New</Text>
            </Pressable>
          </View>

          <View className="gap-3">
            {(coupons ?? []).map((promo: any) => (
              <View
                key={promo.id}
                className="bg-card rounded-[16px] border border-border p-4 flex-row items-center"
              >
                <View className="w-12 h-12 rounded-full bg-background items-center justify-center mr-4 border border-border border-dashed">
                  <Icon name="tag" size={20} color="#64748b" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-[16px] font-heading font-black text-foreground mr-2">
                      {promo.code}
                    </Text>
                    <View
                      className={`px-2 py-0.5 rounded-full ${promo.active ? "bg-green-100" : "bg-accent"}`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${promo.active ? "text-green-700" : "text-muted-foreground"}`}
                      >
                        {promo.active ? "ACTIVE" : "INACTIVE"}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-[13px] text-muted-foreground">
                    {promo.value} • Used {promo.uses ?? 0} times
                  </Text>
                </View>
                <Switch
                  value={promo.active}
                  onValueChange={() => toggleCoupon.mutate(promo.id)}
                  trackColor={{ false: "#e2e8f0", true: "#004CFF" }}
                  thumbColor={"#ffffff"}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Create Coupon Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setModalVisible(false)} />
          <View className="bg-card rounded-t-[32px] p-6 pb-12">
            <View className="w-12 h-1.5 bg-accent rounded-full self-center mb-6" />
            <Text className="text-[20px] font-heading font-bold text-foreground mb-6">
              {editingId ? "Edit Coupon" : "Create Coupon"}
            </Text>

            <View className="gap-4">
              <Input
                label="Coupon Code"
                placeholder="e.g. SUMMER20"
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
              />
              <Input
                label="Value"
                placeholder="e.g. 10% OFF or GHS 5"
                value={value}
                onChangeText={setValue}
              />
              <Button
                title={editingId ? "Update" : "Create"}
                size="lg"
                loading={createCoupon.isPending || updateCoupon.isPending}
                onPress={handleSave}
                className="mt-4"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
