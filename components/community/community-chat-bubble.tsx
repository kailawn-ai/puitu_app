import { CheckCheck, Lock } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

interface CommunityChatBubbleProps {
  body: string;
  senderName?: string | null;
  isOwn: boolean;
  isPrivate?: boolean;
  createdAtLabel: string;
}

export default function CommunityChatBubble({
  body,
  senderName,
  isOwn,
  isPrivate = false,
  createdAtLabel,
}: CommunityChatBubbleProps) {
  return (
    <View className={`mb-3 ${isOwn ? "items-end" : "items-start"}`}>
      <View
        className={`max-w-[84%] rounded-[26px] px-4 py-3 ${
          isOwn
            ? "rounded-br-md bg-slate-200"
            : "rounded-bl-md border border-slate-200 bg-white dark:border-secondary-700 dark:bg-secondary-800"
        }`}
      >
        {!isOwn && !!senderName ? (
          <Text className="mb-1 text-xs font-semibold text-green-500">
            {senderName}
          </Text>
        ) : null}

        <Text
          className={`text-[15px] leading-6 ${
            isOwn ? "text-black" : "text-slate-900 dark:text-white"
          }`}
        >
          {body}
        </Text>

        <View className="mt-2 flex-row items-center justify-end">
          {isPrivate && !isOwn ? <Lock size={11} color="#94A3B8" /> : null}
          <Text
            className={`text-[11px] ${
              isOwn ? "mr-1 text-black" : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {createdAtLabel}
          </Text>
          {isOwn ? (
            <CheckCheck size={12} color="rgba(155,255,255,0.85)" />
          ) : null}
        </View>
      </View>
    </View>
  );
}
