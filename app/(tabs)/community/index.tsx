import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Plus, Search } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CommunityChatRow from "@/components/community/community-chat-row";
import CommunityGroupCard from "@/components/community/community-group-card";
import {
  CommunityGroup,
  CommunityService,
} from "@/lib/services/community-service";

export default function CommunityScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null);
  const [myGroups, setMyGroups] = useState<CommunityGroup[]>([]);
  const [discoverGroups, setDiscoverGroups] = useState<CommunityGroup[]>([]);

  const loadCommunity = async () => {
    try {
      const [mine, discover] = await Promise.all([
        CommunityService.getMyGroups(),
        CommunityService.getGroups({ per_page: 20 }),
      ]);

      setMyGroups(mine);

      const mineIds = new Set(mine.map((group) => group.id));
      setDiscoverGroups(
        discover.data.filter((group) => !mineIds.has(group.id)),
      );
    } catch (error: any) {
      console.log("Community load error:", error);
      Alert.alert(
        "Unable to load community",
        error?.message ?? "Please try again in a moment.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCommunity();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommunity();
  };

  const handlePlaceholderAction = (title: string) => {
    Alert.alert(title, "We can wire this flow next.");
  };

  const openGroupChat = (group: CommunityGroup) => {
    router.push(`/community/${group.id}` as never);
  };

  const handleJoinGroup = (group: CommunityGroup) => {
    Alert.alert(
      "Join group",
      `Join ${group.name} and start chatting with the community?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Join",
          onPress: async () => {
            try {
              setJoiningGroupId(group.id);
              await CommunityService.joinGroup(group.id);
              await loadCommunity();
              Alert.alert("Joined successfully", `You are now part of ${group.name}.`, [
                {
                  text: "Open chat",
                  onPress: () => openGroupChat(group),
                },
                { text: "Later", style: "cancel" },
              ]);
            } catch (error: any) {
              console.log("Join group error:", error);
              Alert.alert(
                "Unable to join group",
                error?.message ?? "Please try again in a moment.",
              );
            } finally {
              setJoiningGroupId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#09090b", "#171717"] // Using your secondary-900 and secondary-800
            : ["#F8FAFC", "#E2E8F0"]
        } // Light mode gradient
        locations={[0, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 14,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View className="px-5">
            <View className="px-5 py-5">
              <View className="mt-5 flex-row">
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => handlePlaceholderAction("Discover Groups")}
                  className="flex-row items-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 dark:border-secondary-700 dark:bg-secondary-800"
                >
                  <Search
                    size={16}
                    color={colorScheme === "dark" ? "#FFF" : "#111827"}
                  />
                  <Text className="ml-2 text-sm font-semibold text-slate-800 dark:text-white">
                    Explore
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => handlePlaceholderAction("Create Group")}
                  className="mr-3 flex-row items-center rounded-2xl bg-primary-500 px-4 py-3"
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text className="ml-2 text-sm font-semibold text-white">
                    Create New Group
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="mt-7">
              <Text className="text-xl font-semibold text-slate-900 dark:text-white">
                Chats
              </Text>
              <Text className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Your joined groups open as live conversations with Firebase-backed
                updates.
              </Text>
            </View>

            <View className="mt-4">
              {myGroups.length ? (
                myGroups.map((group) => (
                  <CommunityChatRow
                    key={group.id}
                    group={group}
                    onPress={openGroupChat}
                  />
                ))
              ) : (
                <View className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 dark:border-secondary-700 dark:bg-secondary-900">
                  <Text className="text-base font-semibold text-slate-900 dark:text-white">
                    You have not joined a group yet
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Join a community below to start chatting, collaborating,
                    and learning together.
                  </Text>
                </View>
              )}
            </View>

            <View className="mt-7">
              <Text className="text-xl font-semibold text-slate-900 dark:text-white">
                Discover communities
              </Text>
            </View>

            <View className="mt-4">
              {discoverGroups.length ? (
                discoverGroups.map((group) => (
                  <CommunityGroupCard
                    key={group.id}
                    group={group}
                    joining={joiningGroupId === group.id}
                    onJoin={handleJoinGroup}
                    onPress={() => handlePlaceholderAction(group.name)}
                  />
                ))
              ) : (
                <View className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 dark:border-secondary-700 dark:bg-secondary-900">
                  <Text className="text-base font-semibold text-slate-900 dark:text-white">
                    Nothing new to explore
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Once more groups are created, they will appear here for
                    discovery.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
