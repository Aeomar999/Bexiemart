import { BackButton } from "@/components/ui/BackButton";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useState, useEffect, useRef } from "react";
import { useMessages, useConversation, useMarkAsRead } from "@/lib/hooks/use-chat";
import { DetailSkeleton } from "@/components/ui/Skeleton";

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? "http://localhost:3000";

export default function VendorChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const { data: fetchedMessages, isLoading } = useMessages(id || "");
  const { data: conversationData } = useConversation(id || "");
  const markAsRead = useMarkAsRead();

  useEffect(() => {
    if (id) {
      markAsRead.mutate(id);
      try {
        const ws = new WebSocket(`${SOCKET_URL}/chat`);
        ws.onopen = () => {
          ws.send(JSON.stringify({ event: "join_conversation", data: { conversationId: id } }));
          setConnected(true);
        };
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.event === "new_message") {
              setMessages((prev) => [...prev, data.data]);
            }
          } catch {}
        };
        ws.onclose = () => setConnected(false);
        wsRef.current = ws;
        return () => ws.close();
      } catch {}
    }
  }, [id]);

  useEffect(() => {
    if (fetchedMessages?.messages) {
      setMessages(fetchedMessages.messages);
    }
  }, [fetchedMessages]);

  const sendMessage = () => {
    if (!message.trim() || !wsRef.current || !connected) {
      if (!connected) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            content: message,
            senderId: "vendor",
            createdAt: new Date().toISOString(),
            isRead: false,
          },
        ]);
        setMessage("");
      }
      return;
    }
    wsRef.current.send(
      JSON.stringify({
        event: "send_message",
        data: { conversationId: id, content: message },
      })
    );
    setMessage("");
  };

  const otherParticipant = conversationData?.participants?.find((p: any) => p.user?.name);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="mr-3" />
        <View className="flex-1">
          <Text className="text-heading-md font-heading font-black text-foreground">
            {otherParticipant?.user?.name || `Customer`}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-0.5">
            <View
              className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-gray-400"}`}
            />
            <Text className="text-body-sm font-body text-muted-foreground">
              {connected ? "Online" : "Offline"}
            </Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <DetailSkeleton />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-5 py-4"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
        >
          <View className="items-center mb-6">
            <Text className="text-body-sm font-bold text-muted-foreground bg-secondary px-3 py-1 rounded-full">
              Today
            </Text>
          </View>

          {messages.map((msg: any) => {
            const isVendor = msg.senderId === "vendor" || msg.sender === "vendor";
            return (
              <View
                key={msg.id}
                className={`max-w-[80%] mb-4 ${isVendor ? "self-end" : "self-start"}`}
              >
                <View
                  className={`p-3 rounded-xl ${isVendor ? "bg-primary rounded-br-none" : "bg-card border border-border rounded-bl-none"}`}
                >
                  <Text className={`text-body-md ${isVendor ? "text-white" : "text-foreground"}`}>
                    {msg.content || msg.text}
                  </Text>
                  <Text
                    className={`text-caption ${isVendor ? "text-white/70 text-right" : "text-muted-foreground"} mt-1`}
                  >
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : msg.time}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Input Area */}
      <View className="px-5 py-3 bg-card border-t border-border flex-row items-center gap-3 pb-8">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Attach file"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="w-10 h-10 rounded-full bg-muted items-center justify-center"
        >
          <Icon name="paperclip" size={20} color="#64748b" />
        </Pressable>
        <View className="flex-1 bg-muted rounded-2xl px-4 py-3 flex-row items-center">
          <TextInput
            className="flex-1 text-body-lg text-foreground p-0 m-0"
            placeholder="Type a message..."
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          onPress={sendMessage}
          className={`w-12 h-12 rounded-full items-center justify-center ${message.trim() ? "bg-primary" : "bg-secondary"}`}
        >
          <Icon
            name="send"
            size={20}
            color={message.trim() ? "#ffffff" : "#94a3b8"}
            style={{ marginLeft: 4 }}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
