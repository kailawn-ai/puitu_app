import { Plus, FileText, Film, MoreVertical, X } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ShortDetailSheet from "@/components/short/short-detail-sheet";

interface ShortQuickMenuProps {
  title: string;
  caption: string;
  creatorLabel: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  onCreateShort?: () => void;
  onMyShorts?: () => void;
}

export default function ShortQuickMenu({
  title,
  caption,
  creatorLabel,
  likesCount,
  commentsCount,
  sharesCount,
  onCreateShort,
  onMyShorts,
}: ShortQuickMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const menuAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(menuAnimation, {
      toValue: menuOpen ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 90,
    }).start();
  }, [menuAnimation, menuOpen]);

  const menuWidth = useMemo(
    () =>
      menuAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [50, 200],
      }),
    [menuAnimation],
  );
  const menuHeight = useMemo(
    () =>
      menuAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [50, 200],
      }),
    [menuAnimation],
  );
  const iconOpacity = useMemo(
    () =>
      menuAnimation.interpolate({
        inputRange: [0, 0.2, 1],
        outputRange: [1, 0, 0],
      }),
    [menuAnimation],
  );
  const panelOpacity = useMemo(
    () =>
      menuAnimation.interpolate({
        inputRange: [0, 0.35, 1],
        outputRange: [0, 0, 1],
      }),
    [menuAnimation],
  );

  return (
    <Animated.View
      style={[
        styles.menuShell,
        {
          width: menuWidth,
          height: menuHeight,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        style={StyleSheet.absoluteFill}
        onPress={() => {
          if (!menuOpen) {
            setMenuOpen(true);
          }
        }}
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.menuIconWrap, { opacity: iconOpacity }]}
      >
        <MoreVertical size={26} color="#FFFFFF" />
      </Animated.View>

      <Animated.View
        pointerEvents={menuOpen ? "auto" : "none"}
        style={[styles.menuPanelContent, { opacity: panelOpacity }]}
      >
        <View className="w-full flex-row items-center justify-between">
          <Text className="text-xs font-bold uppercase tracking-[1.5px] text-white/90">
            Quick Actions
          </Text>

          <TouchableOpacity
            activeOpacity={0.88}
            className="h-8 w-8 items-center justify-center rounded-full bg-white/20"
            onPress={() => setMenuOpen(false)}
          >
            <X size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          className="mt-3 w-full flex-row items-center rounded-2xl border border-white/30 bg-white/20 px-4 py-1.5"
          onPress={() => {
            setMenuOpen(false);
            if (onCreateShort) {
              onCreateShort();
              return;
            }

            Alert.alert(
              "Create short",
              "We can connect this to the creator upload flow next.",
            );
          }}
        >
          <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-white/30">
            <Plus size={25} color="#FFFFFF" />
          </View>
          <Text className="text-sm font-semibold text-white">Create short</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          className="mt-2 w-full flex-row items-center rounded-2xl border border-white/30 bg-white/20 px-4 py-1.5"
          onPress={() => {
            setMenuOpen(false);
            if (onMyShorts) {
              onMyShorts();
              return;
            }

            Alert.alert(
              "My shorts",
              "My Shorts option is ready to be connected.",
            );
          }}
        >
          <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-white/30">
            <Film size={20} color="#FFFFFF" />
          </View>
          <Text className="text-sm font-semibold text-white">My Shorts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          className="mt-2 w-full flex-row items-center rounded-2xl border border-white/30 bg-white/20 px-4 py-1.5"
          onPress={() => {
            setMenuOpen(false);
            setDetailVisible(true);
          }}
        >
          <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-white/30">
            <FileText size={20} color="#FFFFFF" />
          </View>
          <Text className="text-sm font-semibold text-white">Description</Text>
        </TouchableOpacity>
      </Animated.View>

      <ShortDetailSheet
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        title={title}
        creatorLabel={creatorLabel}
        description={caption}
        likesCount={likesCount}
        commentsCount={commentsCount}
        sharesCount={sharesCount}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  menuShell: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  menuIconWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  menuPanelContent: {
    width: "100%",
    height: "100%",
    paddingHorizontal: 14,
    paddingVertical: 5,
    justifyContent: "flex-start",
  },
});
