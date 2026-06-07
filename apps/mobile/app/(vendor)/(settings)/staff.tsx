import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, Switch, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import {
  useVendorStaff,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
  useToggleStaff,
} from "@/lib/hooks/use-vendor-staff";
import { DetailSkeleton } from "@/components/ui/Skeleton";

const ROLES = ["Manager", "Cashier", "Support"];

export default function StaffManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: staffList, isLoading } = useVendorStaff();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();
  const toggleStaff = useToggleStaff();

  const [isFormModalVisible, setFormModalVisible] = useState(false);
  const [isActionModalVisible, setActionModalVisible] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Manager");

  // Selected staff for action sheet
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const toggleAccess = (id: string) => {
    toggleStaff.mutate(id);
  };

  const openAddForm = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setRole("Manager");
    setFormModalVisible(true);
  };

  const openEditForm = () => {
    const staff = staffList?.find((s: any) => s.id === selectedStaffId);
    if (staff) {
      setEditingId(staff.id);
      setName(staff.name);
      setEmail(staff.email);
      setRole(staff.role);
      setActionModalVisible(false);
      setFormModalVisible(true);
    }
  };

  const handleSaveStaff = () => {
    if (!name || !email) {
      Alert.alert("Required", "Name and Email are required.");
      return;
    }

    if (editingId) {
      updateStaff.mutate({ id: editingId, name, email, role });
      Alert.alert("Updated", "Staff details updated successfully.");
    } else {
      createStaff.mutate({ name, email, role });
      Alert.alert("Added", "New staff member added successfully.");
    }
    setFormModalVisible(false);
  };

  const handleDeleteStaff = () => {
    const staff = staffList?.find((s: any) => s.id === selectedStaffId);
    if (!staff) return;

    Alert.alert(
      "Remove Staff",
      `Are you sure you want to remove ${staff.name}? They will lose all access.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            if (selectedStaffId) deleteStaff.mutate(selectedStaffId);
            setActionModalVisible(false);
          },
        },
      ]
    );
  };

  const openActionSheet = (id: string) => {
    setSelectedStaffId(id);
    setActionModalVisible(true);
  };

  const list = staffList ?? [];

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center justify-between"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center">
          <BackButton className="mr-3" />
          <Text className="text-[20px] font-heading font-black text-foreground">Staff</Text>
        </View>
        <Pressable
          onPress={openAddForm}
          className="bg-brand-50 px-3 py-1.5 rounded-full flex-row items-center"
        >
          <Icon name="plus" size={14} color="#004CFF" style={{ marginRight: 4 }} />
          <Text className="text-[12px] font-bold text-brand-600">Add Staff</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <DetailSkeleton />
        </View>
      ) : (
        <ScrollView className="flex-1 px-5 pt-6 pb-12">
          <View className="bg-card rounded-[24px] border border-border overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.02)]">
            {list.map((staff: any, idx: number) => {
              const isLast = idx === list.length - 1;
              return (
                <View key={staff.id} className={`p-5 ${!isLast ? "border-b border-border" : ""}`}>
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 rounded-full bg-brand-100 items-center justify-center mr-3 border-2 border-card shadow-sm">
                        <Text className="text-[16px] font-heading font-black text-brand-600">
                          {staff.name.charAt(0)}
                        </Text>
                      </View>
                      <View>
                        <View className="flex-row items-center">
                          <Text className="text-[16px] font-bold text-foreground mr-2">
                            {staff.name}
                          </Text>
                          <View
                            className={`px-2 py-0.5 rounded-full ${staff.role === "Owner" ? "bg-amber-100" : "bg-muted"}`}
                          >
                            <Text
                              className={`text-[10px] font-bold ${staff.role === "Owner" ? "text-amber-700" : "text-muted-foreground"}`}
                            >
                              {staff.role}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-[13px] text-muted-foreground">{staff.email}</Text>
                      </View>
                    </View>

                    {staff.role !== "Owner" && (
                      <Pressable
                        onPress={() => openActionSheet(staff.id)}
                        className="w-8 h-8 rounded-full bg-background items-center justify-center"
                      >
                        <Icon name="more-vertical" size={16} color="#64748b" />
                      </Pressable>
                    )}
                  </View>

                  {staff.role !== "Owner" && (
                    <View className="flex-row items-center justify-between bg-background p-3 rounded-[12px] border border-border mt-2">
                      <Text className="text-[14px] font-medium text-muted-foreground">
                        Account Access
                      </Text>
                      <Switch
                        value={staff.active}
                        onValueChange={() => toggleAccess(staff.id)}
                        trackColor={{ false: "#e2e8f0", true: "#10b981" }}
                        thumbColor={"#ffffff"}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Add/Edit Staff Modal */}
      <Modal
        visible={isFormModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFormModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setFormModalVisible(false)} />
          <View className="bg-card rounded-t-[32px] p-6 pb-12">
            <View className="w-12 h-1.5 bg-accent rounded-full self-center mb-6" />
            <Text className="text-[20px] font-heading font-bold text-foreground mb-6">
              {editingId ? "Edit Staff Details" : "Add New Staff"}
            </Text>

            <View className="gap-4">
              <Input
                label="Full Name"
                placeholder="e.g. Jane Doe"
                value={name}
                onChangeText={setName}
              />
              <Input
                label="Email Address"
                placeholder="e.g. jane@bexiemart.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View>
                <Text className="text-[14px] font-bold text-muted-foreground mb-2">Role</Text>
                <View className="flex-row gap-2">
                  {ROLES.map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => setRole(r)}
                      className={`px-4 py-2 rounded-full border ${role === r ? "bg-foreground border-surface-900" : "bg-card border-border"}`}
                    >
                      <Text
                        className={`text-[13px] font-bold ${role === r ? "text-white" : "text-muted-foreground"}`}
                      >
                        {r}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Button
                title={editingId ? "Update Staff" : "Add Staff"}
                size="lg"
                onPress={handleSaveStaff}
                loading={createStaff.isPending || updateStaff.isPending}
                className="mt-4"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Action Sheet Modal */}
      <Modal
        visible={isActionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setActionModalVisible(false)} />
          <View className="bg-card rounded-t-[32px] p-6 pb-12">
            <View className="w-12 h-1.5 bg-accent rounded-full self-center mb-6" />
            <Text className="text-[20px] font-heading font-bold text-foreground mb-6">
              Manage Staff
            </Text>

            <View className="gap-3">
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="flex-row items-center p-4 bg-background border border-border rounded-[20px]"
                onPress={openEditForm}
              >
                <View className="w-12 h-12 bg-card rounded-full items-center justify-center border border-border">
                  <Icon name="edit-2" size={20} color="#0f172a" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-[16px] font-bold text-foreground mb-0.5">Edit Details</Text>
                  <Text className="text-[13px] font-body text-muted-foreground">
                    Change name, email or role
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#94a3b8" />
              </Pressable>

              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="flex-row items-center p-4 bg-rose-50 border border-rose-100 rounded-[20px]"
                onPress={handleDeleteStaff}
              >
                <View className="w-12 h-12 bg-card rounded-full items-center justify-center border border-rose-100">
                  <Icon name="trash-2" size={20} color="#ef4444" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-[16px] font-bold text-rose-600 mb-0.5">Remove Staff</Text>
                  <Text className="text-[13px] font-body text-rose-500">
                    Revoke access permanently
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#f87171" />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
