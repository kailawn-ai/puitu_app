import {
  X,
  Heart,
  MessageCircle,
  Share2,
  User,
  Calendar,
  MoreHorizontal,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ShortDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  creatorLabel: string;
  description?: string | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt?: string;
  category?: string;
}

export default function ShortDetailSheet({
  visible,
  onClose,
  title,
  creatorLabel,
  description,
  likesCount,
  commentsCount,
  sharesCount,
  createdAt,
  category = "Content",
}: ShortDetailSheetProps) {
  const [isMounted, setIsMounted] = useState(visible);
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsMounted(true);

      Animated.parallel([
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      return;
    }

    if (!isMounted) return;

    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 280,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsMounted(false);
    });
  }, [visible, isMounted, sheetTranslateY, backdropOpacity]);

  const requestClose = () => {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 280,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsMounted(false);
      onClose();
    });
  };

  if (!isMounted) return null;

  const StatCard = ({ icon: Icon, value, label, color }: any) => (
    <TouchableOpacity
      activeOpacity={0.7}
      className="flex-1 rounded-2xl bg-white/5 backdrop-blur-sm p-4 border border-white/10"
      style={styles.glassCard}
    >
      <View className="flex-row items-center gap-2 mb-2">
        <Icon size={20} color={color} />
        <Text className="text-2xl font-bold text-white">
          {value.toLocaleString()}
        </Text>
      </View>
      <Text className="text-sm font-medium text-white/60">{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      transparent
      visible={isMounted}
      animationType="none"
      onRequestClose={requestClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}
        >
          <Pressable
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onPress={requestClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            {
              transform: [{ translateY: sheetTranslateY }],
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              backgroundColor: "#0A0A0A",
              maxHeight: SCREEN_HEIGHT * 0.85,
            },
            styles.sheetContainer,
          ]}
        >
          {/* Drag Handle */}
          <View className="items-center pt-4 pb-2">
            <View className="w-12 h-1.5 rounded-full bg-white/30" />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            bounces={false}
          >
            {/* Header Section */}
            <View className="px-5 pt-2 pb-4">
              <View className="flex-row items-start justify-between mb-4">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center gap-2 mb-3">
                    <View className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                      <Text className="text-xs font-semibold text-purple-300 tracking-wide">
                        {category}
                      </Text>
                    </View>
                    {createdAt && (
                      <View className="flex-row items-center gap-1">
                        <Calendar size={12} color="#9CA3AF" />
                        <Text className="text-xs text-white/40">
                          {createdAt}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text className="text-3xl font-bold text-white leading-tight mb-2">
                    {title}
                  </Text>

                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 items-center justify-center">
                      <User size={16} color="#FFFFFF" />
                    </View>
                    <Text className="text-base font-semibold text-white/80">
                      {creatorLabel}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={requestClose}
                  className="w-10 h-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
                  style={styles.closeButton}
                >
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats Section */}
            <View className="px-5 mb-6">
              <View className="flex-row gap-3">
                <StatCard
                  icon={Heart}
                  value={likesCount}
                  label="Likes"
                  color="#EF4444"
                />
                <StatCard
                  icon={MessageCircle}
                  value={commentsCount}
                  label="Comments"
                  color="#3B82F6"
                />
                <StatCard
                  icon={Share2}
                  value={sharesCount}
                  label="Shares"
                  color="#10B981"
                />
              </View>
            </View>

            {/* Description Section */}
            <View className="px-5">
              <View className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 p-5 border border-white/10">
                <Text className="text-xs font-semibold uppercase tracking-wider text-purple-300 mb-3">
                  Description
                </Text>
                <Text className="text-base leading-6 text-white/80">
                  {description?.trim() ||
                    "No description available for this short."}
                </Text>

                {/* Decorative gradient line */}
                <LinearGradient
                  colors={[
                    "rgba(139, 92, 246, 0.2)",
                    "rgba(236, 72, 153, 0.2)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientLine}
                />
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
  },
  closeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButton: {
    overflow: "hidden",
  },
  gradientLine: {
    height: 2,
    width: 60,
    borderRadius: 2,
    marginTop: 16,
  },
});
