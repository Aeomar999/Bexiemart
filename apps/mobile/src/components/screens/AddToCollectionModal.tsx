import { tokens } from "@/theme/tokens";
import { View, Text, Modal, Pressable, FlatList } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { useCollections, useAddCollectionItem } from "@/lib/hooks/use-collections";

interface Props {
  visible: boolean;
  productId: string | null;
  onClose: () => void;
}

export function AddToCollectionModal({ visible, productId, onClose }: Props) {
  const { data: collections = [] } = useCollections();
  const addItem = useAddCollectionItem();

  const handleSelect = async (collectionId: string) => {
    if (productId) {
      try {
        await addItem.mutateAsync({ collectionId, productId });
        onClose();
      } catch (e) {
        // Error is handled by the hook
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View className="bg-card rounded-t-3xl p-6 pb-10 max-h-[70%]">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-display-sm font-heading font-black text-foreground">
              Save to Collection
            </Text>
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-muted items-center justify-center"
            >
              <Icon name="x" size={16} color="#0f172a" />
            </Pressable>
          </View>

          {collections.length === 0 ? (
            <Text className="text-muted-foreground text-center py-6 font-body">
              You haven't created any collections yet. Create one first!
            </Text>
          ) : (
            <FlatList
              data={collections}
              keyExtractor={(item: any) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }: { item: any }) => (
                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="flex-row items-center justify-between py-4 border-b border-border"
                  onPress={() => handleSelect(item.id)}
                  disabled={addItem.isPending}
                >
                  <View className="flex-row items-center gap-3">
                    <Icon name="folder" size={20} color={tokens.primary} />
                    <Text className="text-body-lg font-bold text-foreground font-body">
                      {item.name}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#cbd5e1" />
                </Pressable>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
