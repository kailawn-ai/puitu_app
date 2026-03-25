import {
  ShortService,
  type ShortComment,
  type ShortVideo,
} from "@/lib/services/short-service";
import { Send, X, Heart, MoreVertical } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ShortCommentSheetProps {
  visible: boolean;
  short: ShortVideo | null;
  onClose: () => void;
  onCommentAdded?: (shortId: number) => void;
}

const getAuthorName = (comment: ShortComment) =>
  comment.user?.name?.trim() || "Puitu User";

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "PU";

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
};

function CommentRow({
  comment,
  onReply,
  nested = false,
}: {
  comment: ShortComment;
  onReply: (comment: ShortComment) => void;
  nested?: boolean;
}) {
  const authorName = getAuthorName(comment);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);

  const handleLike = () => {
    setLiked((prev) => !prev);
    setLikesCount((prev) => (liked ? Math.max(0, prev - 1) : prev + 1));
  };

  return (
    <View className={nested ? "mt-4 ml-12" : "mt-5"}>
      <View className="flex-row items-start">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53]">
          <Text className="text-sm font-bold text-white">
            {getInitials(authorName)}
          </Text>
        </View>

        <View className="ml-3 flex-1">
          <View className="flex-row items-center flex-wrap gap-x-2">
            <Text className="text-sm font-bold text-white">{authorName}</Text>
            <Text className="text-[11px] text-white/40">
              {formatTimeAgo(comment.created_at)}
            </Text>
            {comment.is_pinned && (
              <View className="px-1.5 py-0.5 rounded-full bg-amber-500/20">
                <Text className="text-[9px] font-bold uppercase tracking-wide text-amber-400">
                  Pinned
                </Text>
              </View>
            )}
          </View>

          <Text className="mt-1.5 text-[14px] leading-5 text-white/90">
            {comment.body}
          </Text>

          <View className="mt-2.5 flex-row items-center gap-x-4">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onReply(comment)}
              className="flex-row items-center"
            >
              <Text className="text-xs font-semibold text-white/60">Reply</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleLike}
              className="flex-row items-center gap-x-1.5"
            >
              {liked ? (
                <Heart size={14} color="#FF6B6B" fill="#FF6B6B" />
              ) : (
                <Heart size={14} color="#FFFFFF" strokeWidth={1.5} />
              )}
              <Text
                className={`text-xs font-semibold ${liked ? "text-[#FF6B6B]" : "text-white/60"}`}
              >
                {likesCount}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          className="h-8 w-8 items-center justify-center rounded-full"
        >
          <MoreVertical size={16} color="#FFFFFF" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {comment.replies?.map((reply) => (
        <CommentRow key={reply.id} comment={reply} onReply={onReply} nested />
      ))}
    </View>
  );
}

export default function ShortCommentSheet({
  visible,
  short,
  onClose,
  onCommentAdded,
}: ShortCommentSheetProps) {
  const [isMounted, setIsMounted] = useState(visible);
  const [comments, setComments] = useState<ShortComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<ShortComment | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const loadComments = useCallback(async () => {
    if (!short) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await ShortService.getComments(short.id, { limit: 50 });
      setComments(response.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load comments.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [short]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates.height);

      // Scroll to bottom when keyboard appears
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        mass: 0.8,
        stiffness: 300,
      }).start();
      loadComments();
      return;
    }

    if (!isMounted) return;

    Animated.timing(sheetTranslateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsMounted(false);
      setReplyTarget(null);
      setMessage("");
      setComments([]);
      setError(null);
      setKeyboardVisible(false);
    });
  }, [visible, isMounted, loadComments, sheetTranslateY]);

  const requestClose = () => {
    Keyboard.dismiss();
    Animated.timing(sheetTranslateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsMounted(false);
      setReplyTarget(null);
      setMessage("");
      onClose();
    });
  };

  const handleSubmit = async () => {
    const body = message.trim();
    if (!body || !short || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await ShortService.createComment(short.id, {
        body,
        reply_to_id: replyTarget?.id ?? null,
      });
      setMessage("");
      setReplyTarget(null);
      onCommentAdded?.(short.id);
      await loadComments();

      // Scroll to top to show new comment
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to send comment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (comment: ShortComment) => {
    setReplyTarget(comment);
    inputRef.current?.focus();
  };

  if (!isMounted || !short) return null;

  return (
    <Modal
      transparent
      visible={isMounted}
      animationType="none"
      onRequestClose={requestClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/60"
          onPress={requestClose}
        >
          <Animated.View
            style={{
              opacity: sheetTranslateY.interpolate({
                inputRange: [0, SCREEN_HEIGHT],
                outputRange: [1, 0],
              }),
            }}
            className="absolute inset-0 bg-black/60"
          />
        </Pressable>

        <Animated.View
          style={{
            transform: [{ translateY: sheetTranslateY }],
          }}
          className="h-[58%] min-h-[420px] max-h-[86%] rounded-t-[28px] bg-[#1b1b1b]"
        >
          {/* Drag Handle */}
          <View className="items-center pt-3 pb-2">
            <View className="h-1 w-12 rounded-full bg-white/20" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pb-4">
            <View className="flex-1">
              <Text className="text-xl font-bold text-white">Comments</Text>
              <Text className="text-xs text-white/50 mt-0.5">
                {short.comments_count ?? comments.length}{" "}
                {short.comments_count === 1 ? "comment" : "comments"}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={requestClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
            >
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            className="flex-1 px-5"
            contentContainerStyle={{
              paddingBottom: 20,
              flexGrow: comments.length === 0 ? 1 : 0,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {isLoading ? (
              <View className="py-16 items-center">
                <ActivityIndicator color="#FF6B6B" size="large" />
              </View>
            ) : null}

            {!isLoading && error ? (
              <View className="rounded-2xl bg-red-500/10 p-4 border border-red-500/20">
                <Text className="text-sm text-red-400 text-center">
                  {error}
                </Text>
                <TouchableOpacity
                  onPress={loadComments}
                  className="mt-3 self-center"
                >
                  <Text className="text-sm font-semibold text-[#FF6B6B]">
                    Try again
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {!isLoading && !comments.length && !error ? (
              <View className="py-16 items-center">
                <View className="h-16 w-16 rounded-full bg-white/5 items-center justify-center mb-4">
                  <Text className="text-3xl">💬</Text>
                </View>
                <Text className="text-base font-semibold text-white mb-1">
                  No comments yet
                </Text>
                <Text className="text-sm text-white/50 text-center">
                  Be the first to share your thoughts
                </Text>
              </View>
            ) : null}

            {comments.map((comment) => (
              <CommentRow
                key={comment.id}
                comment={comment}
                onReply={handleReply}
              />
            ))}

            <View className="h-4" />
          </ScrollView>

          {/* Input Area - Dynamic positioning */}
          <Animated.View
            style={{
              transform: [
                {
                  translateY: keyboardVisible ? -(keyboardHeight + 16) : 0,
                },
              ],
            }}
            className="bg-[#0e0e0e] border-t border-white/10"
          >
            {/* Reply Indicator */}
            {replyTarget && (
              <View className="flex-row items-center justify-between px-5 pt-3 pb-2 bg-white/5">
                <View className="flex-1">
                  <Text className="text-xs text-white/60">Replying to</Text>
                  <Text
                    className="text-sm font-semibold text-white"
                    numberOfLines={1}
                  >
                    {getAuthorName(replyTarget)}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setReplyTarget(null)}
                  className="h-8 w-8 items-center justify-center rounded-full bg-white/10"
                >
                  <X size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Input Container */}
            <View className="px-5 py-3">
              <View className="flex-row items-end gap-x-3">
                <View className="flex-1 rounded-2xl bg-white/10 px-4 py-2.5 min-h-[48px]">
                  <TextInput
                    ref={inputRef}
                    value={message}
                    onChangeText={setMessage}
                    placeholder={
                      replyTarget ? "Write a reply..." : "Add a comment..."
                    }
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    multiline
                    maxLength={2000}
                    style={{
                      color: "#FFFFFF",
                      fontSize: 15,
                      padding: 0,
                      minHeight: 24,
                      maxHeight: 100,
                    }}
                    textAlignVertical="center"
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={isSubmitting || !message.trim()}
                  onPress={handleSubmit}
                  className={`h-12 w-12 items-center justify-center rounded-full ${
                    isSubmitting || !message.trim()
                      ? "bg-white/10"
                      : "bg-[#FF6B6B]"
                  }`}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Send size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Character Counter */}
              {message.length > 0 && (
                <Text className="text-right text-xs text-white/30 mt-2">
                  {message.length}/2000
                </Text>
              )}
            </View>

            {/* Safe area spacer for iOS */}
            {Platform.OS === "ios" && !keyboardVisible && (
              <View className="h-6" />
            )}
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}
