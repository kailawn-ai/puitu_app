import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import CommunitySearchBar from "@/components/community/community-search-bar";
import { useAlert } from "@/providers/alert-provider";
import {
  CommunityGroup,
  CommunityService,
} from "@/lib/services/community-service";

export default function CommunityScreen() {
  const router = useRouter();
  const { showError, showInfo, showConfirm, showSuccess } = useAlert();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 50;
  const FAB_SIZE = 50;
  const FAB_MARGIN = 16;
  const tabBarOffset = TAB_BAR_HEIGHT + insets.bottom;
  const fabBottom = tabBarOffset + FAB_MARGIN;
  const scrollBottomPadding = fabBottom + FAB_SIZE + 24;
  const [refreshing, setRefreshing] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null);
  const [myGroups, setMyGroups] = useState<CommunityGroup[]>([]);
  const [discoverGroups, setDiscoverGroups] = useState<CommunityGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadCommunity = useCallback(async () => {
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
      showError(
        "Unable to load community",
        error?.message ?? "Please try again in a moment.",
      );
    } finally {
      setRefreshing(false);
    }
  }, [showError]);

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommunity();
  };

  const handlePlaceholderAction = (title: string) => {
    showInfo(title, "We can wire this flow next.");
  };

  const openGroupChat = (group: CommunityGroup) => {
    router.push(`/community/${group.id}` as never);
  };

  const handleJoinGroup = (group: CommunityGroup) => {
    showConfirm(
      "Join group",
      `Join ${group.name} and start chatting with the community?`,
      async () => {
        try {
          setJoiningGroupId(group.id);
          await CommunityService.joinGroup(group.id);
          await loadCommunity();
          showSuccess("Joined successfully", `You are now part of ${group.name}.`, [
            {
              text: "Open chat",
              onPress: () => openGroupChat(group),
            },
            { text: "Later", style: "cancel" },
          ]);
        } catch (error: any) {
          console.log("Join group error:", error);
          showError(
            "Unable to join group",
            error?.message ?? "Please try again in a moment.",
          );
        } finally {
          setJoiningGroupId(null);
        }
      },
    );
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesSearch = (group: CommunityGroup) => {
    if (!normalizedQuery) {
      return true;
    }

    return [group.name, group.description]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(normalizedQuery));
  };

  const filteredMyGroups = useMemo(
    () => myGroups.filter(matchesSearch),
    [myGroups, normalizedQuery],
  );
  const filteredDiscoverGroups = useMemo(
    () => discoverGroups.filter(matchesSearch),
    [discoverGroups, normalizedQuery],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      enabled={Platform.OS === "ios"}
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
            paddingBottom: scrollBottomPadding,
          }}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View className="px-5">
            <View className="px-5 py-4">
              <CommunitySearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search chats and communities"
              />
            </View>

            <View className="mt-2">
              <Text className="text-xl font-semibold text-slate-900 dark:text-white">
                Chats
              </Text>
              <Text className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Your joined groups open as live conversations with
                Firebase-backed updates.
              </Text>
            </View>

            <View className="mt-4">
              {filteredMyGroups.length ? (
                filteredMyGroups.map((group) => (
                  <CommunityChatRow
                    key={group.id}
                    group={group}
                    onPress={openGroupChat}
                  />
                ))
              ) : myGroups.length && normalizedQuery ? (
                <View className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 dark:border-secondary-700 dark:bg-secondary-900">
                  <Text className="text-base font-semibold text-slate-900 dark:text-white">
                    No matching chats
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Try a different community name or clear your search to see
                    all joined groups.
                  </Text>
                </View>
              ) : (
                <View className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 dark:border-secondary-700 dark:bg-secondary-900">
                  <Text className="text-base font-semibold text-slate-900 dark:text-white">
                    You have not joined a group yet
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Join a community below to start chatting, collaborating, and
                    learning together.
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
              {filteredDiscoverGroups.length ? (
                filteredDiscoverGroups.map((group) => (
                  <CommunityGroupCard
                    key={group.id}
                    group={group}
                    joining={joiningGroupId === group.id}
                    onJoin={handleJoinGroup}
                    onPress={() => handlePlaceholderAction(group.name)}
                  />
                ))
              ) : discoverGroups.length && normalizedQuery ? (
                <View className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 dark:border-secondary-700 dark:bg-secondary-900">
                  <Text className="text-base font-semibold text-slate-900 dark:text-white">
                    No communities found
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Try a broader search and we will show matching groups here.
                  </Text>
                </View>
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

        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => router.push("/community/create")}
          className="absolute items-center justify-center rounded-full bg-primary-500 shadow-lg"
          style={{
            right: 20,
            bottom: fabBottom,
            width: FAB_SIZE,
            height: FAB_SIZE,
          }}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
