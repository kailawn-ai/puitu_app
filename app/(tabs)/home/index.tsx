// app/(tabs)/home.tsx

import CategorySection from "@/components/home/cat-section-ui";
import HomeSkeleton from "@/components/home/cat-skeleton-ui";
import CourseSection from "@/components/home/cor-section-ui";
import JobSection from "@/components/home/job-section-ui";
import OldQuestionsSection from "@/components/home/old-section-ui";
import QuizQandaSection from "@/components/home/quiz-qanda-section";
import NotificationSection from "@/components/notification/noti-section-ui";
import { HamburgerMenu } from "@/components/ui/hamburger-menu";
import { HomeResponse, HomeService } from "@/lib/services/home-service";
import { saveAuthUserToStore } from "@/lib/utils/auth-user-store";
import { useAlert } from "@/providers/alert-provider";
import { useNotifications } from "@/providers/notification-provider";
import { useRouter } from "expo-router";
import { Bell, Search } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  BackHandler,
  LayoutAnimation,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";

const HomeScreen = () => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const alert = useAlert();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [homeData, setHomeData] = useState<HomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    notifications,
    unreadCount,
    loading: notificationLoading,
    isLive: notificationsAreLive,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  useEffect(() => {
    loadHome();
  }, []);

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const loadHome = async () => {
    try {
      const data = await HomeService.getHome();
      setHomeData(data);

      if (data.current_user) {
        await saveAuthUserToStore(data.current_user, "system");
        await refreshNotifications();
      }
    } catch (e) {
      console.log("Home load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHome();
    setRefreshing(false);
  };

  const closeNotifications = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowNotifications(false);
  };

  const handleNotificationPress = async (
    item: (typeof notifications)[number],
  ) => {
    await markAsRead(item);
    closeNotifications();

    if (item.route) {
      router.push(item.route as never);
    }
  };

  const handleMarkAsReadNotification = async (
    item: (typeof notifications)[number],
  ) => {
    await markAsRead(item);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const performDeleteNotification = async (
    item: (typeof notifications)[number],
  ) => {
    await deleteNotification(item);
  };

  const handleDeleteNotification = (item: (typeof notifications)[number]) => {
    alert.showWarning(
      "Delete Notification",
      "Remove this notification from your history?",
      [
        {
          text: "Cancel",
          onPress: () => null,
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => {
            void performDeleteNotification(item);
          },
          style: "destructive",
        },
      ],
    );
  };

  useEffect(() => {
    const onBackPress = () => {
      if (showNotifications) {
        closeNotifications();
        return true;
      }

      alert.showWarning("Exit App", "Do you really want to exit the app?", [
        {
          text: "Cancel",
          onPress: () => null,
          style: "cancel",
        },
        {
          text: "Exit",
          onPress: () => BackHandler.exitApp(),
          style: "destructive",
        },
      ]);
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => subscription.remove();
  }, [alert, showNotifications]);

  return (
    <View className="flex-1 bg-slate-100 dark:bg-background-ddark">
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="">
        <View className="px-5 flex-row justify-between items-center mb-2">
          <View className="flex-row items-center">
            <HamburgerMenu />
            <View className="ml-4">
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back! 👋
              </Text>
              <Text className="text-gray-600 dark:text-gray-400">
                Continue your learning journey
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.push("/search")}
              className="mr-2 p-2 bg-white dark:bg-secondary-800 rounded-xl"
            >
              <Search size={22} color={isDarkMode ? "#FFFFFF" : "#09090b"} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut,
                );
                setShowNotifications((prev) => !prev);
              }}
              className="p-2 bg-white dark:bg-secondary-800 rounded-xl relative"
            >
              <Bell size={22} color={isDarkMode ? "#FFFFFF" : "#09090b"} />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-600 rounded-full items-center justify-center">
                  <Text className="text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showNotifications && (
        <NotificationSection
          loading={notificationLoading}
          notifications={notifications}
          unreadCount={unreadCount}
          isLive={notificationsAreLive}
          onClose={closeNotifications}
          onViewAll={() => {
            closeNotifications();
            router.push("/notifications");
          }}
          onMarkAllRead={handleMarkAllRead}
          onPressItem={handleNotificationPress}
          onMarkAsReadItem={(item) =>
            handleMarkAsReadNotification(item as (typeof notifications)[number])
          }
          onDeleteItem={(item) =>
            handleDeleteNotification(item as (typeof notifications)[number])
          }
        />
      )}

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && <HomeSkeleton />}
        {!loading && homeData && (
          <>
            {/* Categories */}
            <CategorySection
              categories={homeData.categories}
              onPressItem={(cat) => {
                console.log("Pressed category:", cat.name);
              }}
            />

            {/* Future sections */}
            <CourseSection courses={homeData.courses} />

            <OldQuestionsSection
              questions={homeData.old_questions}
              onPressItem={(question) => {
                router.push(`/old-question/${question.id}`);
              }}
            />
            <JobSection
              jobs={homeData.jobs}
              onPress={(job) => {
                router.push(`/job/${job.id}`);
              }}
            />
            <QuizQandaSection quizzes={homeData.quizzes} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
