import { BackButton } from "@/components/ui/BackButton";
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { useState, useEffect, useRef } from "react";
import Toast from "@/lib/toast-polyfill";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useMessages, useConversation, useMarkAsRead } from "@/lib/hooks/use-chat";

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? "http://localhost:3000";

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { contact, role, conversationId } = useLocalSearchParams<{ contact: string; role: string; conversationId: string }>();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const { data: fetchedMessages } = useMessages(conversationId || "");
  const { data: conversationData } = useConversation(conversationId || "");
  const markAsRead = useMarkAsRead();

  useEffect(() => {
    if (conversationId) {
      markAsRead.mutate(conversationId);
      try {
        const ws = new WebSocket(`${SOCKET_URL}/chat`);
        ws.onopen = () => {
          const token = ""; // will be set from auth store
          ws.send(JSON.stringify({ event: "join_conversation", data: { conversationId } }));
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
  }, [conversationId]);

  useEffect(() => {
    if (fetchedMessages?.messages) {
      setMessages(fetchedMessages.messages);
    }
  }, [fetchedMessages]);

  const sendMessage = () => {
    if (!message.trim() || !wsRef.current || !connected) {
      if (!connected) {
        setMessages((prev) => [...prev, { id: Date.now().toString(), content: message, senderId: "user", createdAt: new Date().toISOString(), isRead: false }]);
        setMessage("");
      }
      return;
    }
    wsRef.current.send(JSON.stringify({
      event: "send_message",
      data: { conversationId, content: message },
    }));
    setMessage("");
  };

  const otherParticipant = conversationData?.participants?.find((p: any) => p.user?.name !== contact);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center justify-between"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <View>
            <Text className="text-[18px] font-heading font-black text-foreground">
              {contact || otherParticipant?.user?.name || "Chat"}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <View className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-gray-400"}`} />
              <Text className="text-caption font-body text-muted-foreground">
                {connected ? (role ? `Your ${role}` : "Online") : "Offline"}
              </Text>
            </View>
          </View>
        </View>
        <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]} className="w-10 h-10 rounded-full bg-background items-center justify-center" onPress={() => router.push("/(customer)/help")}>
          <Icon name="more-vertical" size={20} color="#0f172a" />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-5"
        contentContainerClassName="py-6 gap-4"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
      >
        <View className="items-center mb-4">
          <View className="bg-accent px-3 py-1 rounded-full">
            <Text className="text-[10px] font-bold text-muted-foreground">TODAY</Text>
          </View>
        </View>

        {messages.map((msg: any) => {
          const isUser = msg.senderId === "user" || msg.sender === "user";
          return (
            <View key={msg.id} className={`max-w-[80%] ${isUser ? "self-end" : "self-start"}`}>
              <View className={`p-4 rounded-[20px] ${isUser ? "bg-brand-600 rounded-tr-sm" : "bg-card border border-border rounded-tl-sm"}`}>
                <Text className={`text-[15px] font-body leading-relaxed ${isUser ? "text-white" : "text-foreground"}`}>
                  {msg.content || msg.text}
                </Text>
              </View>
              <Text className={`text-[10px] font-body text-muted-foreground mt-1 ${isUser ? "text-right mr-1" : "ml-1"}`}>
                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : msg.time} {isUser && (msg.isRead ? "✓✓" : "✓")}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View
        className="bg-card border-t border-border px-5 py-3 flex-row items-end gap-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View className="flex-1 bg-background rounded-[24px] px-4 py-3 min-h-[48px] max-h-[120px] justify-center mb-1">
          <TextInput
            className="text-[15px] font-body text-foreground w-full"
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            multiline
            value={message}
            onChangeText={setMessage}
          />
        </View>

        <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          className={`w-12 h-12 rounded-full items-center justify-center flex-shrink-0 mb-1 ${message.trim() ? "bg-brand-600" : "bg-accent"}`}
          disabled={!message.trim()}
          onPress={sendMessage}
        >
          <Icon name="send" size={18} color={message.trim() ? "#fff" : "#94a3b8"} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
