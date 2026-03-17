import type { CommunityMessage } from "@/lib/services/community-service";
import React from "react";
import { Text, View } from "react-native";

interface CommunityMessageBubbleProps {
  message: CommunityMessage;
  isOwn: boolean;
  showAvatar?: boolean;
}

const formatMessageTime = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getInitial = (name?: string | null) =>
  name?.trim()?.charAt(0)?.toUpperCase() || "?";

export default function CommunityMessageBubble({
  message,
  isOwn,
  showAvatar = true,
}: CommunityMessageBubbleProps) {
  const senderName = message.user?.name?.trim() || "Member";

  return (
    <View
      className={`mb-3 flex-row ${isOwn ? "justify-end" : "justify-start"}`}
    >
      {!isOwn && showAvatar ? (
        <View className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-200">
          <Text className="text-xs font-semibold text-white dark:text-slate-900">
            {getInitial(senderName)}
          </Text>
        </View>
      ) : !isOwn ? (
        <View className="mr-2 w-9" />
      ) : null}

      <View
        className={`max-w-[82%] rounded-[24px] px-4 py-3 ${
          isOwn
            ? "rounded-br-md bg-emerald-500"
            : "rounded-bl-md border border-slate-200 bg-white dark:border-secondary-700 dark:bg-secondary-800"
        }`}
      >
        {!isOwn ? (
          <Text className="mb-1 text-xs font-semibold uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
            {senderName}
          </Text>
        ) : null}

        {!!message.body ? (
          <Text
            className={`text-[15px] leading-6 ${
              isOwn ? "text-white" : "text-slate-900 dark:text-white"
            }`}
          >
            {message.body}
          </Text>
        ) : null}

        {!!message.attachments?.length ? (
          <View className="mt-2 rounded-2xl bg-black/5 px-3 py-2 dark:bg-white/10">
            <Text
              className={`text-sm font-medium ${
                isOwn ? "text-white" : "text-slate-800 dark:text-slate-100"
              }`}
            >
              {message.attachments.length} attachment
              {message.attachments.length > 1 ? "s" : ""}
            </Text>
          </View>
        ) : null}

        <Text
          className={`mt-2 text-[11px] ${
            isOwn ? "text-emerald-50/90" : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {formatMessageTime(message.created_at)}
        </Text>
      </View>
    </View>
  );
}
