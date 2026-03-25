import { Bookmark, Heart, MessageCircle, Send } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ShortActionRailProps {
  liked: boolean;
  bookmarked: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  onLike: () => void;
  onComments: () => void;
  onShare: () => void;
  onSave: () => void;
  likeLoading?: boolean;
  shareLoading?: boolean;
  saveLoading?: boolean;
}

const formatCount = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
};

export default function ShortActionRail({
  liked,
  bookmarked,
  likesCount,
  commentsCount,
  sharesCount,
  onLike,
  onComments,
  onShare,
  onSave,
  likeLoading = false,
  shareLoading = false,
  saveLoading = false,
}: ShortActionRailProps) {
  return (
    <View className="mb-3 items-center">
      <TouchableOpacity
        activeOpacity={0.88}
        className="mb-3 items-center"
        onPress={onLike}
      >
        <LinearGradient
          colors={
            liked
              ? ["#FB7185", "#FF3B6F"]
              : ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]
          }
          style={styles.actionButton}
        >
          {likeLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Heart
              size={26}
              color="#FFFFFF"
              fill={liked ? "#FFFFFF" : "transparent"}
            />
          )}
        </LinearGradient>
        <Text className="mt-2 text-xs font-bold text-white">
          {formatCount(likesCount)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.88}
        className="mb-3 items-center"
        onPress={onComments}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
          style={styles.actionButton}
        >
          <MessageCircle size={25} color="#FFFFFF" />
        </LinearGradient>
        <Text className="mt-2 text-xs font-bold text-white">
          {formatCount(commentsCount)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.88}
        className="mb-3 items-center"
        onPress={onShare}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
          style={styles.actionButton}
        >
          {shareLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Send size={24} color="#FFFFFF" />
          )}
        </LinearGradient>
        <Text className="mt-2 text-xs font-bold text-white">
          {formatCount(sharesCount)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.88}
        className="items-center"
        onPress={onSave}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
          style={styles.actionButton}
        >
          {saveLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Bookmark
              size={24}
              color="#FFFFFF"
              fill={bookmarked ? "#FFFFFF" : "transparent"}
            />
          )}
        </LinearGradient>
        <Text className="mt-2 text-xs font-bold text-white">Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
});
