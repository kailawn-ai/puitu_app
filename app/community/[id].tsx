import CommunityChatBubble from "@/components/community/community-chat-bubble";
import { BackButton } from "@/components/ui/back-button";
import LottieLoader from "@/components/ui/lottie-loader";
import { useAuth } from "@/contexts/auth-context";
import CommunityMessageService, {
  type CommunityRealtimeMessage,
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
  BackHandler,
  FlatList,
  Image,
  Keyboard,
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

const formatMessageTime = (
  value?: string | null,
  timestamp?: number | null,
) => {
  const date = timestamp ? new Date(timestamp) : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const toChatMessageFromApi = (
  message: CommunityMessage,
): ChatMessage | null => {
  if (!message.body?.trim()) return null;

  return {
    id: String(message.id),
    userId: message.user_id,
    body: message.body,
    senderName: message.user?.name ?? null,
    createdAt: message.created_at ?? null,
    timestamp: message.created_at
      ? new Date(message.created_at).getTime()
      : null,
  };
};

const toChatMessageFromRealtime = (
  message: CommunityRealtimeMessage,
): ChatMessage | null => {
  if (!message.body?.trim()) return null;

  return {
    id: message.db_message_id
      ? String(message.db_message_id)
      : String(message.id),
    userId: message.user_id,
    body: message.body,
    senderName: message.user?.name ?? null,
    createdAt: message.created_at ?? null,
    timestamp:
      typeof message.timestamp === "number"
        ? message.timestamp
        : message.created_at
          ? new Date(message.created_at).getTime()
          : null,
  };
};

export default function CommunityChatScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const groupId = Array.isArray(id) ? id[0] : id;

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const { user } = useAuth();

  const [group, setGroup] = useState<CommunityGroup | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    user?.uid ?? null,
  );

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const decryptCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (user?.uid) {
      setCurrentUserId(user.uid);
      return;
    }

    getStoredAuthUser()
      .then((stored) => {
        if (stored?.id) {
          setCurrentUserId(stored.id);
        }
      })
      .catch(() => undefined);
  }, [user?.uid]);

  useEffect(() => {
    const onBack = () => {
      router.back();
      return true;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const decryptRealtimeBodyIfNeeded = useCallback(
    async (
      message: CommunityRealtimeMessage,
    ): Promise<CommunityRealtimeMessage> => {
      if (!groupId || !message.is_body_encrypted || !message.body?.trim()) {
        return message;
      }

      const encryptedBody = message.body;
      const cached = decryptCacheRef.current.get(encryptedBody);
      if (cached) {
        return { ...message, body: cached, is_body_encrypted: false };
      }

      try {
        const res = await CommunityMessageService.decryptRealtimeBody(
          groupId,
          encryptedBody,
        );
        decryptCacheRef.current.set(encryptedBody, res.body);
        return { ...message, body: res.body, is_body_encrypted: false };
      } catch {
        return message;
      }
    },
    [groupId],
  );

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const [groupData, initialMessages] = await Promise.all([
          CommunityService.getGroupById(groupId),
          CommunityMessageService.fetchMessages(groupId, { limit: 50 }),
        ]);

        if (!active) return;

        setGroup(groupData);
        setMessages(
          sortMessages(
            initialMessages
              .map(toChatMessageFromApi)
              .filter((item): item is ChatMessage => item !== null),
          ),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load().catch(() => {
      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;

    let active = true;

    const unsubscribeRealtime =
      CommunityMessageService.subscribeToRealtimeMessages(
        groupId,
        (incomingMessages) => {
          void (async () => {
            const decoded = await Promise.all(
              incomingMessages.map((item) => decryptRealtimeBodyIfNeeded(item)),
            );

            if (!active) return;

            setMessages(
              sortMessages(
                decoded
                  .map(toChatMessageFromRealtime)
                  .filter((item): item is ChatMessage => item !== null),
              ),
            );
          })();
        },
      );

    return () => {
      active = false;
      unsubscribeRealtime();
    };
  }, [groupId, decryptRealtimeBodyIfNeeded]);

  useEffect(() => {
    if (!messages.length) return;

    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);

    return () => clearTimeout(timer);
  }, [messages]);

  const handleDraftChange = (value: string) => {
    setDraft(value);
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!groupId || !body || sending) return;

    try {
      setSending(true);
      setDraft("");

      const created = await CommunityMessageService.sendMessage(groupId, {
        body,
      });
      const localMessage = toChatMessageFromApi(created);

      if (localMessage) {
        setMessages((prev) => {
          const map = new Map(prev.map((msg) => [msg.id, msg]));
          map.set(localMessage.id, localMessage);
          return sortMessages(Array.from(map.values()));
        });
      }
    } finally {
      setSending(false);
    }
  };

  const headerTitle = useMemo(
    () => group?.name ?? "Community chat",
    [group?.name],
  );
  const groupAvatarUri = useMemo(
    () => group?.avatar_url?.trim() ?? "",
    [group?.avatar_url],
  );

  if (loading) {
    return (
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#0B0F19", "#171717"]
            : ["#F8FAFC", "#E2E8F0"]
        }
        locations={[0, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center">
          <LottieLoader size={88} />
          <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Loading chat...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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
          className="border-b border-white/40 px-4 dark:border-secondary-700 bg-white/65 dark:bg-black/65"
          style={{ paddingTop: insets.top + 0 }}
        >
          <View className="flex-row items-center">
            <BackButton onPress={() => router.back()} />

            {groupAvatarUri ? (
              <View className="ml-3 h-12 w-12 overflow-hidden rounded-2xl bg-slate-200 dark:bg-secondary-700">
                <Image
                  source={{ uri: groupAvatarUri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View className="ml-3 h-12 w-12 items-center justify-center rounded-2xl bg-primary-500">
                <MessageCircleMore size={22} color="#FFFFFF" />
              </View>
            )}

            <View className="ml-3 flex-1">
              <Text
                numberOfLines={1}
                className="text-lg font-semibold text-slate-900 dark:text-white"
              >
                {headerTitle}
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
              <Info
                size={18}
                color={colorScheme === "dark" ? "#FFFFFF" : "#111827"}
              />
            </View>
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => buildMessageKey(item)}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 18,
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
                Start the conversation and this group will come alive in
                realtime.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        <View
          className="px-4 pt-3"
          style={{
            paddingBottom:
              Platform.OS === "ios"
                ? isKeyboardVisible
                  ? 10
                  : insets.bottom + 10
                : 10,
          }}
        >
          <View className="flex-row items-end rounded-[28px] border border-slate-200 bg-slate-50 px-3 py-1 dark:border-secondary-700 dark:bg-secondary-800">
            <TextInput
              value={draft}
              onChangeText={handleDraftChange}
              placeholder="Write a message..."
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
              className="max-h-20 flex-1 px-2 text-[15px] leading-6 text-slate-900 dark:text-white"
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
