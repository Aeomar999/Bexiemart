import { tokens } from "@/theme/tokens";
import { BackButton } from "@/components/ui/BackButton";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import Toast from "@/lib/toast-polyfill";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/lib/hooks/use-addresses";
import type { Address } from "@/lib/stores/address-store";
import { useFormValidation } from "@/lib/hooks/use-form-validation";
import { addressSchema } from "@/lib/validation/schemas";

export default function AddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: addressesData, isPending, isError, refetch } = useAddresses();
  const addresses = addressesData ?? [];
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "Home",
    name: "",
    address: "",
    city: "",
    phone: "",
  });
  const { errors, validate, clearErrors } = useFormValidation(addressSchema);

  const handleSetDefault = (id: string) => {
    setDefault.mutate(id, {
      onSuccess: () => {
        Toast.show({
          type: "success",
          text1: "Default Address Set",
          text2: "Your default delivery address has been updated.",
        });
      },
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "Home":
        return "home";
      case "Office":
        return "briefcase";
      default:
        return "map-pin";
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ type: "Home", name: "", address: "", city: "", phone: "" });
    clearErrors();
    setIsModalVisible(true);
  };

  const openEditModal = (address: Address) => {
    setEditingId(address.id);
    setFormData({
      type: address.type,
      name: address.name,
      address: address.address,
      city: address.city,
      phone: address.phone,
    });
    clearErrors();
    setIsModalVisible(true);
  };

  const handleSave = () => {
    if (!validate(formData)) {
      Toast.show({
        type: "error",
        text1: "Invalid Fields",
        text2: "Please correct the errors before saving.",
      });
      return;
    }

    if (editingId) {
      updateAddress.mutate(
        { id: editingId, ...formData },
        {
          onSuccess: () => {
            Toast.show({
              type: "success",
              text1: "Address Updated",
              text2: "Your address has been saved.",
            });
            setIsModalVisible(false);
          },
        }
      );
    } else {
      createAddress.mutate(
        { ...formData, isDefault: false },
        {
          onSuccess: () => {
            Toast.show({
              type: "success",
              text1: "Address Added",
              text2: "Your new address has been added.",
            });
            setIsModalVisible(false);
          },
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    deleteAddress.mutate(id, {
      onSuccess: () => {
        Toast.show({
          type: "info",
          text1: "Address Removed",
          text2: "The address has been deleted.",
        });
      },
    });
  };

  if (isPending) {
    return (
      <View className="flex-1 bg-background pt-12">
        <ListSkeleton />
      </View>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load your addresses." onRetry={refetch} />;
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row justify-between items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-display-sm font-heading font-black text-foreground">
            Delivery Addresses
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add address"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          className="w-10 h-10 rounded-full bg-primary-subtle items-center justify-center border border-border"
          onPress={openAddModal}
        >
          <Icon name="plus" size={20} color={tokens.primary} />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-10" showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {addresses.map((address: any) => (
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              key={address.id}
              className={`bg-card rounded-2xl p-5 border ${address.isDefault ? "border-primary bg-primary-subtle/20" : "border-border"}`}
              onPress={() => handleSetDefault(address.id)}
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center gap-2">
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center ${address.isDefault ? "bg-primary-subtle" : "bg-muted"}`}
                  >
                    <Icon
                      name={getIcon(address.type)}
                      size={14}
                      color={address.isDefault ? tokens.primary : "#64748b"}
                    />
                  </View>
                  <Text className="text-body-md font-heading font-bold text-foreground uppercase tracking-wider">
                    {address.type}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  {address.isDefault && (
                    <View className="bg-primary px-2 py-0.5 rounded-md justify-center">
                      <Text className="text-caption font-bold text-white uppercase tracking-wider">
                        Default
                      </Text>
                    </View>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Delete address"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => handleDelete(address.id)}
                    className="w-6 h-6 items-center justify-center bg-rose-50 rounded-full border border-rose-100"
                  >
                    <Icon name="trash-2" size={12} color="#ef4444" />
                  </Pressable>
                </View>
              </View>

              <Text className="text-body-lg font-bold text-foreground font-body mb-1">
                {address.name}
              </Text>
              <Text className="text-body-md text-muted-foreground font-body mb-0.5">
                {address.address}
              </Text>
              <Text className="text-body-md text-muted-foreground font-body mb-3">
                {address.city}
              </Text>
              <Text className="text-body-md font-medium text-foreground font-body mb-4">
                {address.phone}
              </Text>

              <View className="flex-row gap-3 pt-4 border-t border-border">
                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="flex-1 items-center py-1"
                  onPress={(e) => {
                    e.stopPropagation();
                    openEditModal(address);
                  }}
                >
                  <Text className="text-sm font-bold text-primary font-heading">Edit</Text>
                </Pressable>
                {!address.isDefault && (
                  <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    className="flex-1 items-center py-1 border-l border-border"
                    onPress={(e) => {
                      e.stopPropagation();
                      handleSetDefault(address.id);
                    }}
                  >
                    <Text className="text-sm font-bold text-muted-foreground font-heading">
                      Set Default
                    </Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          ))}
          {addresses.length === 0 && (
            <View className="py-10">
              <EmptyState
                title="No addresses found"
                description="Add your delivery address to proceed with checkout."
                iconName="map-pin"
                fullScreen={false}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Address Form Modal */}
      {isModalVisible && (
        <View
          className="absolute inset-0 z-50 flex-1 justify-end bg-black/50"
          style={{ zIndex: 100 }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 justify-end"
          >
            <View
              className="bg-card rounded-t-3xl p-6 pb-10"
              style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            >
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-display-sm font-heading font-bold text-foreground">
                  {editingId ? "Edit Address" : "Add Address"}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => setIsModalVisible(false)}
                  className="w-8 h-8 rounded-full bg-muted items-center justify-center"
                >
                  <Icon name="x" size={16} color="#64748b" />
                </Pressable>
              </View>

              <ScrollView className="mb-4" showsVerticalScrollIndicator={false}>
                {/* Type Selection */}
                <View className="flex-row gap-3 mb-4">
                  {["Home", "Office", "Other"].map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => setFormData({ ...formData, type })}
                      className={`flex-1 py-3 items-center rounded-xl border ${formData.type === type ? "border-primary bg-primary-subtle" : "border-border bg-card"}`}
                    >
                      <Icon
                        name={getIcon(type)}
                        size={18}
                        color={formData.type === type ? tokens.primary : "#64748b"}
                      />
                      <Text
                        className={`text-body-sm mt-1 font-bold ${formData.type === type ? "text-primary-hover" : "text-muted-foreground"}`}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Inputs */}
                <View className="gap-4">
                  <Input
                    label="Full Name"
                    placeholder="Enter recipient's name"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    error={errors.name}
                  />

                  <Input
                    label="Phone Number"
                    placeholder="e.g., +233 24 123 4567"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    error={errors.phone}
                  />

                  <Input
                    label="Street Address"
                    placeholder="Enter street or building"
                    value={formData.address}
                    onChangeText={(text) => setFormData({ ...formData, address: text })}
                    error={errors.address}
                  />

                  <Input
                    label="City / Region"
                    placeholder="e.g., Accra"
                    value={formData.city}
                    onChangeText={(text) => setFormData({ ...formData, city: text })}
                    error={errors.city}
                  />
                </View>
              </ScrollView>

              <Pressable
                onPress={handleSave}
                className="bg-primary py-4 rounded-full items-center mt-2"
              >
                <Text className="text-white font-bold text-body-lg">Save Address</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
}
