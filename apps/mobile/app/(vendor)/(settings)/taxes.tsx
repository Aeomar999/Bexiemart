import { tokens } from "@/theme/tokens";
import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import {
  useVendorDocuments,
  useUploadDocument,
  useDeleteDocument,
} from "@/lib/hooks/use-vendor-documents";
import { DetailSkeleton } from "@/components/ui/Skeleton";

export default function TaxesDocumentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: documents, isLoading } = useVendorDocuments();
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();

  const [tin, setTin] = useState("");
  const [vatRegistered, setVatRegistered] = useState(false);

  const [isUploadModalVisible, setUploadModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUploadOption = (type: string) => {
    setIsUploading(true);
    uploadDocument.mutate(
      { source: type, name: `document_${Date.now()}.pdf` },
      {
        onSettled: () => {
          setIsUploading(false);
          setUploadModalVisible(false);
        },
        onSuccess: () => {
          Alert.alert("Success", "Document uploaded successfully.");
        },
      }
    );
  };

  const removeDocument = (id: string) => {
    Alert.alert("Remove Document", "Are you sure you want to remove this document?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => deleteDocument.mutate(id),
      },
    ]);
  };

  const handleSubmit = () => {
    if (!tin) {
      Alert.alert("Required", "Tax Identification Number (TIN) is required.");
      return;
    }
    if (!documents || documents.length === 0) {
      Alert.alert("Required", "Please upload at least one business document.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Verification Pending",
        "Your details and documents have been submitted for review. We will notify you once verified.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }, 1500);
  };

  const docList = documents ?? [];

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="mr-3" />
        <Text className="text-display-sm font-heading font-black text-foreground">Taxes & KYC</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <DetailSkeleton />
        </View>
      ) : (
        <ScrollView className="flex-1 px-5 pt-6 pb-12">
          <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex-row items-start">
            <Icon
              name="alert-circle"
              size={20}
              color="#d97706"
              style={{ marginRight: 12, marginTop: 2 }}
            />
            <View className="flex-1">
              <Text className="text-body-lg font-bold text-amber-800 mb-1">
                Verification Required
              </Text>
              <Text className="text-sm text-amber-700 leading-relaxed">
                Please complete your KYC to increase your withdrawal limits and get the "Verified
                Vendor" badge.
              </Text>
            </View>
          </View>

          <View className="bg-card rounded-2xl border border-border p-5 mb-6">
            <Text className="text-body-lg font-bold text-foreground mb-4">Tax Information</Text>
            <Input
              label="Tax Identification Number (TIN)"
              placeholder="e.g. P0000000000"
              value={tin}
              onChangeText={setTin}
            />
            <View className="mt-4">
              <Text className="text-sm font-bold text-muted-foreground mb-2">
                VAT Registration Status
              </Text>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setVatRegistered(true)}
                  className={`flex-1 flex-row items-center p-4 rounded-lg border ${vatRegistered ? "bg-primary-subtle border-border" : "bg-background border-border"}`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${vatRegistered ? "border-primary" : "border-border"}`}
                  >
                    {vatRegistered && <View className="w-2.5 h-2.5 bg-primary rounded-full" />}
                  </View>
                  <Text
                    className={`text-body-md font-bold ${vatRegistered ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    Registered
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setVatRegistered(false)}
                  className={`flex-1 flex-row items-center p-4 rounded-lg border ${!vatRegistered ? "bg-foreground border-border" : "bg-background border-border"}`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${!vatRegistered ? "border-card" : "border-border"}`}
                  >
                    {!vatRegistered && <View className="w-2.5 h-2.5 bg-card rounded-full" />}
                  </View>
                  <Text
                    className={`text-body-md font-bold ${!vatRegistered ? "text-white" : "text-muted-foreground"}`}
                  >
                    Not Reg.
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View className="bg-card rounded-2xl border border-border p-5 mb-6">
            <Text className="text-body-lg font-bold text-foreground mb-1">Business Documents</Text>
            <Text className="text-sm text-muted-foreground mb-4">
              Upload your registration certificate or ID.
            </Text>

            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              onPress={() => setUploadModalVisible(true)}
              className="border-2 border-dashed border-border rounded-xl p-6 items-center justify-center bg-primary-subtle"
            >
              <View className="w-12 h-12 rounded-full bg-card items-center justify-center mb-3 shadow-sm border border-border">
                <Icon name="upload-cloud" size={20} color={tokens.primary} />
              </View>
              <Text className="text-body-lg font-bold text-primary-hover mb-1">Tap to Upload</Text>
              <Text className="text-body-sm text-primary">PDF, JPG, or PNG (Max 5MB)</Text>
            </Pressable>

            {docList.length > 0 && (
              <View className="mt-4 gap-2">
                {docList.map((doc: any) => (
                  <View
                    key={doc.id}
                    className="p-3 bg-background rounded-lg border border-border flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center flex-1 pr-2">
                      <View className="w-8 h-8 rounded-full bg-secondary items-center justify-center mr-3">
                        <Icon name="file-text" size={14} color="#64748b" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                          {doc.name}
                        </Text>
                        <Text
                          className={`text-caption font-bold mt-0.5 ${doc.status === "VERIFIED" ? "text-green-600" : "text-amber-600"}`}
                        >
                          {doc.status}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => removeDocument(doc.id)}
                      className="w-8 h-8 items-center justify-center rounded-full bg-rose-50"
                    >
                      <Icon name="x" size={16} color="#ef4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          <Button
            title="Submit for Verification"
            size="lg"
            loading={isSubmitting}
            onPress={handleSubmit}
            className="w-full mb-8"
          />
        </ScrollView>
      )}

      {/* Upload Action Sheet */}
      <Modal
        visible={isUploadModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isUploading && setUploadModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable
            className="absolute inset-0"
            onPress={() => !isUploading && setUploadModalVisible(false)}
          />
          <View className="bg-card rounded-t-3xl p-6 pb-12">
            <View className="w-12 h-1.5 bg-secondary rounded-full self-center mb-6" />
            <Text className="text-display-sm font-heading font-bold text-foreground mb-6">
              Upload Document
            </Text>

            {isUploading ? (
              <View className="py-8 items-center justify-center">
                <DetailSkeleton />
                <Text className="mt-4 text-body-lg font-bold text-muted-foreground">
                  Uploading file...
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="flex-row items-center p-4 bg-background border border-border rounded-2xl"
                  onPress={() => handleUploadOption("photo")}
                >
                  <View className="w-12 h-12 bg-card rounded-full items-center justify-center border border-border">
                    <Icon name="camera" size={20} color="#0f172a" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-body-lg font-bold text-foreground mb-0.5">
                      Take Photo
                    </Text>
                    <Text className="text-sm font-body text-muted-foreground">
                      Use camera to capture document
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="flex-row items-center p-4 bg-background border border-border rounded-2xl"
                  onPress={() => handleUploadOption("library")}
                >
                  <View className="w-12 h-12 bg-card rounded-full items-center justify-center border border-border">
                    <Icon name="image" size={20} color="#0f172a" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-body-lg font-bold text-foreground mb-0.5">
                      Photo Library
                    </Text>
                    <Text className="text-sm font-body text-muted-foreground">
                      Choose from your camera roll
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="flex-row items-center p-4 bg-background border border-border rounded-2xl"
                  onPress={() => handleUploadOption("file")}
                >
                  <View className="w-12 h-12 bg-card rounded-full items-center justify-center border border-border">
                    <Icon name="file" size={20} color="#0f172a" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-body-lg font-bold text-foreground mb-0.5">
                      Browse Files
                    </Text>
                    <Text className="text-sm font-body text-muted-foreground">
                      Upload a PDF or document file
                    </Text>
                  </View>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
