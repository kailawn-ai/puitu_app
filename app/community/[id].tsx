import CommunityChatBubble from "@/components/community/community-chat-bubble";
import { BackButton } from "@/components/ui/back-button";
import { useAuth } from "@/contexts/auth-context";
import CommunityMessageService, {
  type CommunityRealtimeMessage,
  type CommunityTypingRecord,
} from "@/lib/services/community-message-service";
import {
  CommunityService,
  type CommunityGroup,
  type CommunityMessage,
} from "@/lib/services/community-service";
import { getStoredAuthUser } from "@/lib/utils/auth-user-store";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Info,
  Lock,
  MessageCircleMore,
  SendHorizontal,
  Users,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ChatMessage = {
  id: string;
  userId: string;
  body: string;
  senderName?: string | null;
  createdAt?: string | null;
  timestamp?: number | null;
};

const buildMessageKey = (
  message: Pick<ChatMessage, "id" | "userId" | "createdAt" | "body">,
) => {
  return `${message.id}:${message.userId}:${message.createdAt ?? ""}:${message.body}`;
};

const toChatMessage = (
  message: CommunityMessage | CommunityRealtimeMessage,
): ChatMessage | null => {
  if (!message.body?.trim()) return null;

  const messageId =
    "db_message_id" in message && message.db_message_id
      ? String(message.db_message_id)
      : String(message.id);

  return {
    id: messageId,
    userId: message.user_id,
    body: message.body,
    senderName: message.user?.name ?? null,
    createdAt: message.created_at ?? null,
    timestamp:
      "timestamp" in message && typeof message.timestamp === "number"
        ? message.timestamp
        : message.created_at
          ? new Date(message.created_at).getTime()
          : null,
  };
};

const sortMessages = (messages: ChatMessage[]) => {
  return [...messages].sort((a, b) => {
    const left =
      typeof a.timestamp === "number"
        ? a.timestamp
        : new Date(a.createdAt ?? "").getTime();
    const right =
      typeof b.timestamp === "number"
        ? b.timestamp
        : new Date(b.createdAt ?? "").getTime();

    return left - right;
  });
};

const mergeMessages = (
  current: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] => {
  const next = new Map<string, ChatMessage>();

  [...current, ...incoming].forEach((message) => {
    next.set(buildMessageKey(message), message);
  });

  return sortMessages(Array.from(next.values()));
};

const formatMessageTime = (value?: string | null, timestamp?: number | null) => {
  const date = timestamp ? new Date(timestamp) : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getTypingText = (typingIds: string[]) => {
  if (!typingIds.length) return null;
  if (typingIds.length === 1) return "Someone is typing...";
  return `${typingIds.length} people are typing...`;
};

export default function CommunityChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [group, setGroup] = useState<CommunityGroup | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingRecord, setTypingRecord] = useState<CommunityTypingRecord>({});
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    user?.uid ?? null,
  );

  const loadChat = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);

      const [groupData, history, storedUser] = await Promise.all([
        CommunityService.getGroupById(id),
        CommunityMessageService.fetchMessages(id, { limit: 60 }),
        getStoredAuthUser(),
      ]);

      setGroup(groupData);
      setCurrentUserId(storedUser?.id ?? user?.uid ?? null);
      setMessages(
        sortMessages(
          history
            .map((message) => toChatMessage(message))
            .filter((message): message is ChatMessage => !!message),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [id, user?.uid]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  useEffect(() => {
    if (!id) return;

    const unsubscribeMessages = CommunityMessageService.subscribeToRealtimeMessages(
      id,
      (items) => {
        const incoming = items
          .map((message) => toChatMessage(message))
          .filter((message): message is ChatMessage => !!message);

        if (!incoming.length) return;
        setMessages((current) => mergeMessages(current, incoming));
      },
    );

    const unsubscribeTyping = CommunityMessageService.subscribeToTyping(
      id,
      (typing) => {
        setTypingRecord(typing);
      },
    );

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [id]);

  useEffect(() => {
    if (!messages.length) return;
    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeout);
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (id) {
        CommunityMessageService.setTyping(id, false).catch(() => undefined);
      }
    };
  }, [id]);

  const activeTypingIds = useMemo(() => {
    const now = Date.now();

    return Object.entries(typingRecord)
      .filter(([userId, state]) => {
        if (!state?.typing || userId === currentUserId) return false;

        const timestamp =
          typeof state.timestamp === "number"
            ? state.timestamp
            : state.timestamp
              ? new Date(state.timestamp).getTime()
              : now;

        return now - timestamp < 6000;
      })
      .map(([userId]) => userId);
  }, [currentUserId, typingRecord]);

  const typingText = useMemo(
    () => getTypingText(activeTypingIds),
    [activeTypingIds],
  );

  const handleDraftChange = (value: string) => {
    setDraft(value);

    if (!id) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      CommunityMessageService.setTyping(id, true).catch(() => undefined);
      typingTimeoutRef.current = setTimeout(() => {
        CommunityMessageService.setTyping(id, false).catch(() => undefined);
      }, 1600);
    } else {
      CommunityMessageService.setTyping(id, false).catch(() => undefined);
    }
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !id || sending) return;

    try {
      setSending(true);
      setDraft("");

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      await CommunityMessageService.setTyping(id, false);

      const message = await CommunityMessageService.sendMessage(id, { body });
      const normalized = toChatMessage(message);

      if (normalized) {
        setMessages((current) => mergeMessages(current, [normalized]));
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={
          colorScheme === "dark" ? ["#0B0F19", "#171717"] : ["#F8FAFC", "#E2E8F0"]
        }
        locations={[0, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7A25FF" />
          <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Loading chat...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#0A0F1F", "#121826", "#18181B"]
            : ["#EEF4FF", "#F8FAFC", "#E2E8F0"]
        }
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <View
          className="border-b border-white/40 px-4 pb-4 dark:border-secondary-700"
          style={{ paddingTop: insets.top + 8 }}
        >
          <View className="flex-row items-center">
            <BackButton onPress={() => router.back()} />

            <View className="ml-3 h-12 w-12 items-center justify-center rounded-2xl bg-primary-500">
              <MessageCircleMore size={22} color="#FFFFFF" />
            </View>

            <View className="ml-3 flex-1">
              <Text
                numberOfLines={1}
                className="text-lg font-semibold text-slate-900 dark:text-white"
              >
                {group?.name ?? "Community chat"}
              </Text>

              <View className="mt-1 flex-row items-center">
                <Users size={13} color="#64748B" />
                <Text className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                  {group?.members_count ?? 0} members
                </Text>
                {group?.is_private ? (
                  <>
                    <Text className="mx-2 text-slate-400">•</Text>
                    <Lock size={12} color="#64748B" />
                    <Text className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                      Private
                    </Text>
                  </>
                ) : null}
              </View>
            </View>

            <View className="h-11 w-11 items-center justify-center rounded-full bg-white/70 dark:bg-secondary-800">
              <Info size={18} color={colorScheme === "dark" ? "#FFFFFF" : "#111827"} />
            </View>
          </View>

          <Text className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {typingText ??
              "Hybrid WhatsApp + Telegram feel, powered by your community realtime channel."}
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => buildMessageKey(item)}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 20,
          }}
          renderItem={({ item }) => (
            <CommunityChatBubble
              body={item.body}
              senderName={item.senderName}
              isOwn={item.userId === currentUserId}
              isPrivate={!!group?.is_private}
              createdAtLabel={formatMessageTime(item.createdAt, item.timestamp)}
            />
          )}
          ListEmptyComponent={
            <View className="items-center rounded-[28px] border border-dashed border-slate-300 bg-white/75 px-6 py-10 dark:border-secondary-700 dark:bg-secondary-900/80">
              <Text className="text-base font-semibold text-slate-900 dark:text-white">
                No messages yet
              </Text>
              <Text className="mt-2 text-center text-sm leading-6 text-slate-600 dark:text-slate-300">
                Start the conversation and this group will come alive in realtime.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        <View
          className="border-t border-white/40 bg-white/90 px-4 pt-3 dark:border-secondary-700 dark:bg-secondary-900/95"
          style={{ paddingBottom: insets.bottom + 10 }}
        >
          <View className="flex-row items-end rounded-[28px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-secondary-700 dark:bg-secondary-800">
            <TextInput
              value={draft}
              onChangeText={handleDraftChange}
              placeholder="Write a message..."
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
              className="max-h-28 flex-1 px-2 text-[15px] leading-6 text-slate-900 dark:text-white"
            />

            <TouchableOpacity
              activeOpacity={0.9}
              disabled={!draft.trim() || sending}
              onPress={handleSend}
              className={`ml-3 h-12 w-12 items-center justify-center rounded-full ${
                !draft.trim() || sending
                  ? "bg-slate-300 dark:bg-secondary-700"
                  : "bg-primary-500"
              }`}
            >
              <SendHorizontal size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
