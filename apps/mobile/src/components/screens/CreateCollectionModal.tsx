import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useCreateCollection } from "@/lib/hooks/use-collections";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function CreateCollectionModal({ visible, onClose }: Props) {
  const [name, setName] = useState("");
  const createCollection = useCreateCollection();
  const successHandled = useRef(false);

  useEffect(() => {
    if (visible) {
      setName("");
      successHandled.current = false;
    }
  }, [visible]);

  useEffect(() => {
    if (createCollection.isSuccess && !successHandled.current) {
      successHandled.current = true;
      setName("");
      onClose();
    }
  }, [createCollection.isSuccess, onClose]);

  const handleCreate = () => {
    if (!name.trim() || createCollection.isPending) return;
    createCollection.mutate({ name: name.trim() });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <Pressable onStartShouldSetResponder={() => true} onResponderRelease={() => {}}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View className="bg-card rounded-t-[32px] p-6 pb-10">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-[20px] font-heading font-black text-foreground">
                  New Collection
                </Text>
                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  onPress={onClose}
                  className="w-8 h-8 rounded-full bg-muted items-center justify-center"
                >
                  <Icon name="x" size={16} color="#0f172a" />
                </Pressable>
              </View>

              <View className="mb-6">
                <Text className="text-[14px] font-bold text-foreground font-heading mb-3">
                  Collection Name
                </Text>
                <View className="flex-row items-center bg-background h-[52px] rounded-[16px] px-4 border border-border focus:border-primary">
                  <Icon name="folder" size={20} color="#94a3b8" />
                  <TextInput
                    className="flex-1 ml-3 text-[16px] font-body text-foreground h-full"
                    placeholder="e.g., Summer Outfits"
                    placeholderTextColor="#94a3b8"
                    value={name}
                    onChangeText={setName}
                    autoFocus
                  />
                </View>
              </View>

              <Button
                title="Create Collection"
                size="lg"
                className="w-full rounded-[16px]"
                onPress={handleCreate}
                disabled={!name.trim() || createCollection.isPending}
                loading={createCollection.isPending}
              />
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
