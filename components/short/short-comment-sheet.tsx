import {
  ShortService,
  type ShortComment,
  type ShortVideo,
} from "@/lib/services/short-service";
import { Send, X, Heart, MoreVertical } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  type AlertButton,
  Animated,
  Easing,
  Keyboard,
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
import auth from "@react-native-firebase/auth";

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

const getReplyTargetName = (comment: ShortComment) =>
  comment.reply_to?.user?.name?.trim() || "";

const getCommentTimestamp = (comment: ShortComment) => {
  const parsed = new Date(comment.created_at ?? "").getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const flattenComments = (items: ShortComment[]): ShortComment[] =>
  items.flatMap((comment) => [
    comment,
    ...(comment.replies ? flattenComments(comment.replies) : []),
  ]);

const getRootCommentId = (
  commentId: number,
  commentMap: Map<number, ShortComment>,
): number => {
  let currentId = commentId;
  let safetyCounter = 0;

  while (safetyCounter < 20) {
    const currentComment = commentMap.get(currentId);
    if (!currentComment?.reply_to_id) {
      return currentId;
    }

    currentId = currentComment.reply_to_id;
    safetyCounter += 1;
  }

  return commentId;
};

const sortComments = (
  items: ShortComment[],
  options: { nested?: boolean } = {},
): ShortComment[] => {
  const { nested = false } = options;

  return [...items]
    .map((comment) => ({
      ...comment,
      replies: comment.replies?.length
        ? sortComments(comment.replies, { nested: true })
        : (comment.replies ?? []),
    }))
    .sort((left, right) => {
      if ((left.is_pinned ?? false) !== (right.is_pinned ?? false)) {
        return left.is_pinned ? -1 : 1;
      }

      return nested
        ? getCommentTimestamp(left) - getCommentTimestamp(right)
        : getCommentTimestamp(right) - getCommentTimestamp(left);
    });
};

const buildCommentTree = (items: ShortComment[]): ShortComment[] => {
  const flatComments = flattenComments(items);
  const commentMap = new Map<number, ShortComment>();
  const roots: ShortComment[] = [];

  flatComments.forEach((comment) => {
    commentMap.set(comment.id, {
      ...comment,
      replies: [],
    });
  });

  flatComments.forEach((comment) => {
    const normalizedComment = commentMap.get(comment.id);
    if (!normalizedComment) return;

    if (comment.reply_to_id) {
      const directParent = commentMap.get(comment.reply_to_id);
      const rootParent = commentMap.get(
        getRootCommentId(comment.reply_to_id, commentMap),
      );

      if (directParent) {
        normalizedComment.reply_to = normalizedComment.reply_to ?? directParent;
      }

      if (rootParent) {
        rootParent.replies = [...(rootParent.replies ?? []), normalizedComment];
        return;
      }
    }

    roots.push(normalizedComment);
  });

  return sortComments(roots);
};

const insertCommentIntoTree = (
  items: ShortComment[],
  newComment: ShortComment,
): ShortComment[] => {
  const itemExists = (commentsToCheck: ShortComment[]): boolean =>
    commentsToCheck.some(
      (comment) =>
        comment.id === newComment.id ||
        (comment.replies?.length ? itemExists(comment.replies) : false),
    );

  if (itemExists(items)) {
    return items;
  }

  if (!newComment.reply_to_id) {
    return [newComment, ...items];
  }

  const findCommentById = (
    commentsToSearch: ShortComment[],
    commentId: number,
  ): ShortComment | null => {
    for (const comment of commentsToSearch) {
      if (comment.id === commentId) {
        return comment;
      }

      if (comment.replies?.length) {
        const nestedMatch = findCommentById(comment.replies, commentId);
        if (nestedMatch) {
          return nestedMatch;
        }
      }
    }

    return null;
  };

  const getRootThreadId = (
    commentsToSearch: ShortComment[],
    commentId: number,
  ): number => {
    let currentId = commentId;
    let safetyCounter = 0;

    while (safetyCounter < 20) {
      const currentComment = findCommentById(commentsToSearch, currentId);
      if (!currentComment?.reply_to_id) {
        return currentId;
      }

      currentId = currentComment.reply_to_id;
      safetyCounter += 1;
    }

    return commentId;
  };

  const rootThreadId = getRootThreadId(items, newComment.reply_to_id);
  const replyTargetComment = findCommentById(items, newComment.reply_to_id);
  let inserted = false;

  const nextItems = items.map((comment) => {
    if (comment.id === rootThreadId) {
      inserted = true;
      return {
        ...comment,
        replies: [
          ...(comment.replies ?? []),
          {
            ...newComment,
            reply_to: newComment.reply_to ?? replyTargetComment ?? undefined,
          },
        ],
      };
    }

    return comment;
  });

  return sortComments(inserted ? nextItems : [newComment, ...nextItems]);
};

const updateCommentInTree = (
  items: ShortComment[],
  commentId: number,
  updater: (comment: ShortComment) => ShortComment,
): ShortComment[] => {
  let changed = false;

  const nextItems = items.map((comment) => {
    if (comment.id === commentId) {
      changed = true;
      return updater(comment);
    }

    if (comment.replies?.length) {
      const nextReplies = updateCommentInTree(
        comment.replies,
        commentId,
        updater,
      );
      if (nextReplies !== comment.replies) {
        changed = true;
        return {
          ...comment,
          replies: nextReplies,
        };
      }
    }

    return comment;
  });

  return changed ? sortComments(nextItems) : items;
};

function CommentRow({
  comment,
  onReply,
  onToggleLike,
  onOpenMenu,
  canManageComment,
  nested = false,
}: {
  comment: ShortComment;
  onReply: (comment: ShortComment) => void;
  onToggleLike: (comment: ShortComment) => void;
  onOpenMenu: (comment: ShortComment) => void;
  canManageComment: boolean;
  nested?: boolean;
}) {
  const authorName = getAuthorName(comment);
  const replyTargetName = getReplyTargetName(comment);
  const liked = comment.liked_by_me ?? false;
  const likesCount = comment.likes_count || 0;

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
            {replyTargetName ? (
              <Text className="font-semibold text-xs text-[#FF6B6B]">
                @{replyTargetName}{" "}
              </Text>
            ) : null}
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
              onPress={() => onToggleLike(comment)}
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

        {canManageComment ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onOpenMenu(comment)}
            className="h-8 w-8 items-center justify-center rounded-full"
          >
            <MoreVertical size={16} color="#FFFFFF" strokeWidth={1.5} />
          </TouchableOpacity>
        ) : null}
      </View>

      {comment.replies?.map((reply) => (
        <CommentRow
          key={reply.id}
          comment={reply}
          onReply={onReply}
          onToggleLike={onToggleLike}
          onOpenMenu={onOpenMenu}
          canManageComment={canManageComment}
          nested
        />
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
  const currentUserId = auth().currentUser?.uid ?? null;
  const canPinComments = short?.user_id === currentUserId;

  const loadComments = useCallback(async () => {
    if (!short) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await ShortService.getComments(short.id, { limit: 50 });
      setComments(buildCommentTree(response.data));
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
    setError(null);

    try {
      const response = await ShortService.createComment(short.id, {
        body,
        reply_to_id: replyTarget?.id ?? null,
      });

      setComments((currentComments) =>
        insertCommentIntoTree(currentComments, {
          ...response.data,
          replies: response.data.replies ?? [],
        }),
      );

      setMessage("");
      setReplyTarget(null);
      onCommentAdded?.(short.id);

      setTimeout(() => {
        if (response.data.reply_to_id) {
          scrollViewRef.current?.scrollToEnd({ animated: true });
          return;
        }

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

  const handleToggleCommentLike = async (comment: ShortComment) => {
    try {
      const response = await ShortService.toggleCommentLike(comment.id);
      setComments((currentComments) =>
        updateCommentInTree(currentComments, comment.id, (currentComment) => ({
          ...currentComment,
          likes_count: response.data.likes_count,
          liked_by_me: response.data.liked,
        })),
      );
    } catch (likeError) {
      setError(
        likeError instanceof Error
          ? likeError.message
          : "Failed to update comment like.",
      );
    }
  };

  const handleTogglePin = async (comment: ShortComment) => {
    try {
      setError(null);
      const response = await ShortService.updateComment(comment.id, {
        is_pinned: !comment.is_pinned,
      });

      setComments((currentComments) =>
        updateCommentInTree(currentComments, comment.id, (currentComment) => ({
          ...currentComment,
          ...response.data,
          replies: currentComment.replies ?? response.data.replies ?? [],
        })),
      );
    } catch (pinError) {
      setError(
        pinError instanceof Error
          ? pinError.message
          : "Failed to update pinned comment.",
      );
    }
  };

  const handleOpenCommentMenu = (comment: ShortComment) => {
    if (!canPinComments) return;

    const actions: AlertButton[] = [
      {
        text: comment.is_pinned ? "Unpin comment" : "Pin comment",
        onPress: () => void handleTogglePin(comment),
      },
      { text: "Cancel", style: "cancel" },
    ];

    Alert.alert("Comment actions", "Choose an action.", actions);
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
                onToggleLike={handleToggleCommentLike}
                onOpenMenu={handleOpenCommentMenu}
                canManageComment={canPinComments}
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
