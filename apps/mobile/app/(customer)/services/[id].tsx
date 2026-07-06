import { BackButton } from "@/components/ui/BackButton";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Linking,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useState } from "react";
import { useService, useBookService } from "@/lib/hooks/use-services";
import { useAddressStore, Address } from "@/lib/stores/address-store";
import { usePopupStore } from "@/lib/stores/popup-store";
import { DetailSkeleton } from "@/components/ui/Skeleton";

const DATES = ["Today", "Tomorrow", "Wednesday", "Thursday", "Custom"];

export default function ProviderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: service, isLoading } = useService(id as string);
  const bookService = useBookService();
  const addresses = useAddressStore((s) => s.addresses);
  const showPopup = usePopupStore((s) => s.showPopup);

  const [selectedDate, setSelectedDate] = useState(DATES[0]);
  const [selectedTime, setSelectedTime] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(addresses[0] || null);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <DetailSkeleton />
      </View>
    );
  }

  if (!service) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="font-heading text-body-lg text-foreground">Service not found.</Text>
        <Pressable onPress={() => router.back()} className="mt-4 px-6 py-3 bg-primary rounded-full">
          <Text className="text-white font-bold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleBook = () => {
    const finalDate = selectedDate === "Custom" ? customDate : selectedDate;
    const finalTime = selectedDate === "Custom" ? customTime : selectedTime;

    if (!finalTime || !selectedAddress || (selectedDate === "Custom" && !customDate)) return;

    const scheduledAt =
      selectedDate === "Custom" ? `${customDate} ${customTime}` : `${selectedDate} ${selectedTime}`;

    bookService
      .mutateAsync({
        id: service.id,
        message: `Schedule for ${scheduledAt}`,
        scheduledAt: new Date().toISOString(),
      })
      .then(() => {
        showPopup({
          type: "success",
          title: "Booking Confirmed",
          message: `${service.vendor?.shopName ?? service.name} is scheduled for ${finalDate} at ${finalTime}.`,
        });
        router.back();
      })
      .catch(() => {
        showPopup({
          type: "error",
          title: "Booking Failed",
          message: "Could not complete your booking. Please try again.",
        });
      });
  };

  const isFormValid =
    (selectedDate === "Custom"
      ? customDate.trim() !== "" && customTime.trim() !== ""
      : selectedTime !== "") && selectedAddress !== null;

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-display-sm font-heading font-black text-foreground">
            {service?.vendor?.shopName || service?.name || "Service"}
          </Text>
        </View>
      </View>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header / Cover */}
        <View className="bg-card pb-6 rounded-b-3xl">
          <View
            className="px-5 flex-row items-center justify-between z-10 mb-6"
            style={{ paddingTop: 12 }}
          >
            <View className="w-10 h-10" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle favorite"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="w-10 h-10 rounded-full bg-muted items-center justify-center"
            >
              <Icon name="heart" size={20} color="#0f172a" />
            </Pressable>
          </View>

          <View className="px-5 items-center">
            <View className="w-24 h-24 bg-muted rounded-2xl items-center justify-center mb-4">
              <Icon name="user" size={40} color="#94a3b8" />
            </View>
            <Text className="text-display-md font-heading font-black text-foreground text-center mb-1">
              {service.vendor?.shopName ?? service.name}
            </Text>
            <Text className="text-body-md text-primary font-bold mb-4">{service.name}</Text>

            <View className="flex-row items-center justify-center gap-6">
              <View className="items-center">
                <View className="flex-row items-center mb-1">
                  <Icon name="star" size={16} color="#f59e0b" />
                  <Text className="text-body-lg font-bold text-foreground ml-1">
                    {Number(service.rating).toFixed(1)}
                  </Text>
                </View>
                <Text className="text-body-sm text-muted-foreground font-body">
                  {service.ratingCount} reviews
                </Text>
              </View>
              <View className="w-[1px] h-8 bg-secondary" />
              <View className="items-center">
                <Text className="text-body-lg font-bold text-foreground mb-1">
                  {service.priceDisplay ?? `GHS ${Number(service.price).toFixed(2)}`}
                </Text>
                <Text className="text-body-sm text-muted-foreground font-body">Pricing</Text>
              </View>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View className="px-5 mt-8">
          <Text className="text-heading-md font-heading font-bold text-foreground mb-3">About</Text>
          <Text className="text-body-md font-body text-muted-foreground leading-relaxed">
            {service.description}
          </Text>
        </View>

        {/* Contact Actions */}
        <View className="px-5 mt-6 flex-row gap-3">
          <Pressable
            className="flex-1 bg-primary-subtle border border-border py-3 rounded-xl flex-row items-center justify-center gap-2"
            onPress={() =>
              showPopup({
                type: "success",
                title: "Chat Opened",
                message: `Connecting you to ${service.vendor?.shopName ?? service.name}...`,
              })
            }
          >
            <Icon name="message-circle" size={18} color="#0284c7" />
            <Text className="text-primary-hover font-bold text-body-md">Chat</Text>
          </Pressable>
          <Pressable
            className="flex-1 bg-primary-subtle border border-border py-3 rounded-xl flex-row items-center justify-center gap-2"
            onPress={() => Linking.openURL("tel:+233555555555")}
          >
            <Icon name="phone" size={18} color="#0284c7" />
            <Text className="text-primary-hover font-bold text-body-md">Call</Text>
          </Pressable>
        </View>

        {/* Scheduling */}
        <View className="px-5 mt-8 mb-4">
          <Text className="text-heading-md font-heading font-bold text-foreground mb-4">
            Schedule Service
          </Text>

          <Text className="text-body-md font-bold text-muted-foreground mb-3">Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            {DATES.map((date) => (
              <Pressable
                key={date}
                className={`mr-3 px-5 py-3 rounded-full border ${selectedDate === date ? "border-primary bg-primary-subtle" : "border-border bg-card"}`}
                onPress={() => setSelectedDate(date)}
              >
                <Text
                  className={`font-bold ${selectedDate === date ? "text-primary-hover" : "text-muted-foreground"}`}
                >
                  {date}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {selectedDate === "Custom" ? (
            <View className="mb-6 gap-4">
              <View>
                <Text className="text-body-md font-bold text-muted-foreground mb-2">
                  Enter Custom Date
                </Text>
                <TextInput
                  className="bg-card border border-border rounded-xl h-12 px-4 font-body text-body-md text-foreground"
                  placeholder="e.g. 24th October"
                  value={customDate}
                  onChangeText={setCustomDate}
                />
              </View>
              <View>
                <Text className="text-body-md font-bold text-muted-foreground mb-2">
                  Enter Custom Time
                </Text>
                <TextInput
                  className="bg-card border border-border rounded-xl h-12 px-4 font-body text-body-md text-foreground"
                  placeholder="e.g. 10:00 AM"
                  value={customTime}
                  onChangeText={setCustomTime}
                />
              </View>
            </View>
          ) : (
            <>
              <Text className="text-body-md font-bold text-muted-foreground mb-3">
                Available Times
              </Text>
              <View className="flex-row flex-wrap gap-3 mb-6">
                {["10:00 AM", "12:30 PM", "3:00 PM", "5:00 PM"].map((time) => (
                  <Pressable
                    key={time}
                    className={`w-[30%] py-3 rounded-xl border items-center justify-center ${selectedTime === time ? "border-primary bg-primary-subtle" : "border-border bg-card"}`}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text
                      className={`font-bold text-sm ${selectedTime === time ? "text-primary-hover" : "text-muted-foreground"}`}
                    >
                      {time}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Spacer for bottom CTA */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Booking Footer */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-card border-t border-border p-5 rounded-t-3xl"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-body-sm text-muted-foreground font-bold mb-1">
              Service Address
            </Text>
            <Pressable
              className="flex-row items-center"
              onPress={() => setAddressModalVisible(true)}
            >
              <Text className="text-body-md font-bold text-foreground mr-2" numberOfLines={1}>
                {selectedAddress ? selectedAddress.name : "Select Address"}
              </Text>
              <Icon name="chevron-down" size={16} color="#64748b" />
            </Pressable>
          </View>
        </View>

        <Pressable
          className={`h-14 rounded-full flex-row items-center justify-center ${isFormValid ? "bg-primary" : "bg-secondary"}`}
          disabled={!isFormValid}
          onPress={handleBook}
        >
          <Text
            className={`font-heading font-bold text-body-lg ${isFormValid ? "text-white" : "text-muted-foreground"}`}
          >
            Confirm Booking
          </Text>
        </Pressable>
      </View>

      {/* Address Selection Modal */}
      <Modal
        visible={addressModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/50"
        >
          <View
            className="bg-card rounded-t-3xl max-h-[70%]"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row justify-between items-center p-5 border-b border-border">
              <Text className="text-heading-md font-bold font-heading text-foreground">
                Select Address
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => setAddressModalVisible(false)}
                className="w-8 h-8 rounded-full bg-muted items-center justify-center"
              >
                <Icon name="x" size={16} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="p-5">
              {addresses.map((addr) => (
                <Pressable
                  key={addr.id}
                  className={`p-4 rounded-2xl border mb-4 ${selectedAddress?.id === addr.id ? "border-primary bg-primary-subtle" : "border-border bg-card"}`}
                  onPress={() => {
                    setSelectedAddress(addr);
                    setAddressModalVisible(false);
                  }}
                >
                  <View className="flex-row items-center mb-2">
                    <Icon
                      name={
                        addr.type === "home"
                          ? "home"
                          : addr.type === "office"
                            ? "briefcase"
                            : "map-pin"
                      }
                      size={18}
                      color={selectedAddress?.id === addr.id ? "#3b82f6" : "#64748b"}
                    />
                    <Text
                      className={`font-bold ml-2 ${selectedAddress?.id === addr.id ? "text-primary-hover" : "text-foreground"}`}
                    >
                      {addr.name}
                    </Text>
                  </View>
                  <Text className="text-muted-foreground text-sm">{addr.address}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
