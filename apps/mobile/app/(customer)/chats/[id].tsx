import { View, Text, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui";
import { Image } from "expo-image";
import { useChatMessages, useConversations } from "@/lib/hooks/use-chat";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSocketStore } from "@/lib/stores/socket-store";
import { useState, useRef, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { uploadApi } from "@/lib/api/upload";
import { format } from "date-fns";
import { BackButton } from "@/components/ui/BackButton";

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  const { data: messagesData, isLoading, sendMessage, sendTypingEvent, typingUsers } = useChatMessages(id as string);
  const { data: conversations } = useConversations();
  const onlineUsers = useSocketStore(s => s.onlineUsers);

  const conversation = conversations?.find(c => c.id === id);
  const otherParticipant = conversation?.participants.find((p: any) => p.id !== user?.id);
  const isOnline = otherParticipant ? onlineUsers[otherParticipant.id] : false;
  const isTyping = otherParticipant ? typingUsers[otherParticipant.id] : false;

  const handleSendText = () => {
    if (!content.trim()) return;
    sendMessage.mutate({ content: content.trim(), type: 'TEXT' });
    setContent("");
    sendTypingEvent(false);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        setIsUploading(true);
        const asset = result.assets[0];
        const filename = asset.fileName || asset.uri.split('/').pop() || 'image.jpg';
        // upload to cloudinary
        const { url } = await uploadApi.uploadFile({
          uri: asset.uri,
          name: filename,
          type: "image/jpeg"
        }, "chats");
        
        // send message
        sendMessage.mutate({ type: 'IMAGE', mediaUrl: url });
      } catch (e) {
        console.error("Upload failed", e);
        alert("Failed to upload image.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.senderId === user?.id;

    return (
      <View className={`w-full flex-row mb-4 px-5 ${isMine ? "justify-end" : "justify-start"}`}>
        {!isMine && (
          <Image
            source={{ uri: otherParticipant?.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(otherParticipant?.name || "") }}
            style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8, marginTop: 4 }}
            contentFit="cover"
          />
        )}
        <View className={`max-w-[75%] rounded-[16px] px-4 py-2.5 ${isMine ? "bg-brand-600 rounded-tr-sm" : "bg-accent rounded-tl-sm"}`}>
          {item.type === 'IMAGE' && item.mediaUrl ? (
            <Image 
              source={{ uri: item.mediaUrl }}
              style={{ width: 200, height: 200, borderRadius: 8, marginBottom: 4 }}
              contentFit="cover"
            />
          ) : (
            <Text className={`text-[15px] font-body ${isMine ? "text-white" : "text-foreground"}`}>
              {item.content}
            </Text>
          )}
          <Text className={`text-[10px] mt-1 ${isMine ? "text-white/70 text-right" : "text-muted-foreground text-left"}`}>
            {format(new Date(item.createdAt), "h:mm a")}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-background" 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View 
        className="px-5 bg-card pb-3 border-b border-border flex-row items-center shadow-sm z-10" 
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="w-10 h-10 items-start justify-center active:opacity-70" />
        
        {otherParticipant && (
          <View className="flex-1 flex-row items-center ml-2">
            <View className="relative">
              <Image
                source={{ uri: otherParticipant.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(otherParticipant.name) }}
                style={{ width: 36, height: 36, borderRadius: 18 }}
                contentFit="cover"
              />
              {isOnline && (
                <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
              )}
            </View>
            <View className="ml-3">
              <Text className="text-[16px] font-heading font-bold text-foreground leading-tight">
                {otherParticipant.name}
              </Text>
              <Text className="text-[12px] font-body text-muted-foreground leading-tight">
                {isTyping ? "Typing..." : (isOnline ? "Online" : "Offline")}
              </Text>
            </View>
          </View>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#004CFF" />
        </View>
      ) : (
        <FlatList
          data={messagesData?.data || []}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 20 }}
        />
      )}

      {/* Input Area */}
      <View className="px-5 py-3 border-t border-border bg-card flex-row items-end" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <Pressable 
          className="w-10 h-10 items-center justify-center bg-accent rounded-full mb-1 active:opacity-70"
          onPress={handlePickImage}
          disabled={isUploading}
        >
          {isUploading ? <ActivityIndicator size="small" color="#004CFF" /> : <Icon name="image" size={20} color="#64748b" />}
        </Pressable>
        
        <View className="flex-1 bg-accent rounded-[20px] px-4 pt-3 pb-3 ml-2 mr-2 max-h-[100px] min-h-[44px]">
          <TextInput
            className="flex-1 text-[15px] font-body text-foreground p-0 m-0 leading-tight"
            placeholder="Message..."
            placeholderTextColor="#94a3b8"
            multiline
            value={content}
            onChangeText={(text) => {
              setContent(text);
              sendTypingEvent(text.length > 0);
            }}
          />
        </View>

        <Pressable 
          className={`w-10 h-10 items-center justify-center rounded-full mb-1 ${content.trim() ? 'bg-brand-600' : 'bg-muted'}`}
          onPress={handleSendText}
          disabled={!content.trim()}
        >
          <Icon name="send" size={18} color={content.trim() ? "#fff" : "#94a3b8"} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
