import { tokens } from "@/theme/tokens";
import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, Switch, Alert, Modal, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useState, useEffect } from "react";
import { useVendorHours, useUpdateVendorHours } from "@/lib/hooks/use-vendor-hours";
import { DetailSkeleton } from "@/components/ui/Skeleton";

const DAYS_OF_WEEK = [
  { id: "mon", label: "Monday" },
  { id: "tue", label: "Tuesday" },
  { id: "wed", label: "Wednesday" },
  { id: "thu", label: "Thursday" },
  { id: "fri", label: "Friday" },
  { id: "sat", label: "Saturday" },
  { id: "sun", label: "Sunday" },
];

const generateTimes = () => {
  const times = [];
  const periods = ["AM", "PM"];
  for (let p = 0; p < 2; p++) {
    for (let h = 0; h < 12; h++) {
      let hour = h === 0 ? 12 : h;
      let hourStr = hour < 10 ? `0${hour}` : `${hour}`;
      times.push(`${hourStr}:00 ${periods[p]}`);
      times.push(`${hourStr}:30 ${periods[p]}`);
    }
  }
  return times;
};
const TIME_OPTIONS = generateTimes();

export default function OperatingHoursScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: apiHours, isLoading } = useVendorHours();
  const updateHours = useUpdateVendorHours();

  const [hours, setHours] = useState<Record<string, any>>({});

  useEffect(() => {
    if (apiHours) {
      const mapped: Record<string, any> = {};
      DAYS_OF_WEEK.forEach((day) => {
        const found = (apiHours as any[]).find((h: any) => h.day === day.id);
        mapped[day.id] = found || { isOpen: day.id !== "sun", open: "08:00 AM", close: "06:00 PM" };
      });
      setHours(mapped);
    }
  }, [apiHours]);

  const [pickerConfig, setPickerConfig] = useState<{
    visible: boolean;
    dayId: string;
    type: "open" | "close";
    currentValue: string;
  } | null>(null);

  const toggleDay = (id: string) => {
    setHours((prev: any) => ({
      ...prev,
      [id]: { ...prev[id], isOpen: !prev[id].isOpen },
    }));
  };

  const handleTimeSelect = (time: string) => {
    if (pickerConfig) {
      setHours((prev: any) => ({
        ...prev,
        [pickerConfig.dayId]: {
          ...prev[pickerConfig.dayId],
          [pickerConfig.type]: time,
        },
      }));
      setPickerConfig(null);
    }
  };

  const handleSave = () => {
    const payload = DAYS_OF_WEEK.map((day) => ({
      day: day.id,
      isOpen: hours[day.id]?.isOpen ?? false,
      open: hours[day.id]?.open ?? "08:00 AM",
      close: hours[day.id]?.close ?? "06:00 PM",
    }));
    updateHours.mutate(payload, {
      onSuccess: () => {
        Alert.alert("Success", "Operating hours updated successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      },
    });
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="mr-3" />
        <Text className="text-display-sm font-heading font-black text-foreground">
          Operating Hours
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <DetailSkeleton />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="pb-12 pt-6 gap-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-card rounded-2xl border border-border overflow-hidden">
            {DAYS_OF_WEEK.map((day, idx) => {
              const isLast = idx === DAYS_OF_WEEK.length - 1;
              const data = hours[day.id] || { isOpen: false, open: "08:00 AM", close: "06:00 PM" };

              return (
                <View key={day.id} className={`p-5 ${!isLast ? "border-b border-border" : ""}`}>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text
                      className={`text-body-lg font-bold ${data.isOpen ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {day.label}
                    </Text>
                    <Switch
                      value={data.isOpen}
                      onValueChange={() => toggleDay(day.id)}
                      trackColor={{ false: "#e2e8f0", true: tokens.primary }}
                      thumbColor={"#ffffff"}
                    />
                  </View>

                  {data.isOpen ? (
                    <View className="flex-row items-center justify-between mt-2">
                      <Pressable
                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                        onPress={() =>
                          setPickerConfig({
                            visible: true,
                            dayId: day.id,
                            type: "open",
                            currentValue: data.open,
                          })
                        }
                        className="flex-1 bg-background rounded-lg px-4 py-3 border border-border"
                      >
                        <Text className="text-body-sm text-muted-foreground mb-0.5">
                          Opening Time
                        </Text>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-body-lg font-bold text-foreground">
                            {data.open}
                          </Text>
                          <Icon name="chevron-down" size={16} color="#64748b" />
                        </View>
                      </Pressable>
                      <View className="px-3">
                        <Text className="text-muted-foreground font-bold">-</Text>
                      </View>
                      <Pressable
                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                        onPress={() =>
                          setPickerConfig({
                            visible: true,
                            dayId: day.id,
                            type: "close",
                            currentValue: data.close,
                          })
                        }
                        className="flex-1 bg-background rounded-lg px-4 py-3 border border-border"
                      >
                        <Text className="text-body-sm text-muted-foreground mb-0.5">
                          Closing Time
                        </Text>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-body-lg font-bold text-foreground">
                            {data.close}
                          </Text>
                          <Icon name="chevron-down" size={16} color="#64748b" />
                        </View>
                      </Pressable>
                    </View>
                  ) : (
                    <Text className="text-body-md text-muted-foreground mt-1">Closed</Text>
                  )}
                </View>
              );
            })}
          </View>

          <Button
            title="Save Hours"
            size="lg"
            loading={updateHours.isPending}
            onPress={handleSave}
            className="w-full mt-4"
          />
        </ScrollView>
      )}

      {/* Time Picker Modal */}
      <Modal
        visible={!!pickerConfig?.visible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPickerConfig(null)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setPickerConfig(null)} />
          <View className="bg-card rounded-t-3xl p-6 pb-12 h-[60%]">
            <View className="w-12 h-1.5 bg-secondary rounded-full self-center mb-6" />
            <Text className="text-display-sm font-heading font-bold text-foreground mb-6">
              Select {pickerConfig?.type === "open" ? "Opening" : "Closing"} Time
            </Text>

            <FlatList
              data={TIME_OPTIONS}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item === pickerConfig?.currentValue;
                return (
                  <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => handleTimeSelect(item)}
                    className={`flex-row items-center justify-between p-4 rounded-xl mb-2 border ${
                      isSelected ? "bg-primary-subtle border-border" : "bg-card border-border"
                    }`}
                  >
                    <Text
                      className={`text-body-lg font-bold ${
                        isSelected ? "text-primary-hover" : "text-foreground"
                      }`}
                    >
                      {item}
                    </Text>
                    {isSelected && <Icon name="check-circle" size={20} color={tokens.primary} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
