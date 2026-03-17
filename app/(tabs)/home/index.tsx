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
import {
  AppNotificationItem,
  NotificationService,
} from "@/lib/services/notification-service";
import { saveAuthUserToStore } from "@/lib/utils/auth-user-store";
import { useAlert } from "@/providers/alert-provider";
import { getAuth } from "@react-native-firebase/auth";
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

const HomeScreen = () => {
  const router = useRouter();
  const alert = useAlert();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [homeData, setHomeData] = useState<HomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(true);
  const notificationUserId =
    getAuth().currentUser?.uid || homeData?.current_user?.id || null;

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

  useEffect(() => {
    if (!notificationUserId) {
      setNotifications([]);
      setNotificationLoading(false);
      return;
    }

    setNotificationLoading(true);
    let isMounted = true;
    let hasRealtimeSnapshot = false;

    const unsubscribe = NotificationService.subscribeToUserNotifications(
      notificationUserId,
      (items) => {
        hasRealtimeSnapshot = true;
        if (!isMounted) return;
        setNotifications(items);
        setNotificationLoading(false);
      },
      (error) => {
        console.log("Notification subscription error:", error);
        if (isMounted) {
          setNotificationLoading(false);
        }
      },
    );

    NotificationService.fetchUserNotifications()
      .then((items) => {
        if (!isMounted || hasRealtimeSnapshot) return;
        setNotifications(items);
      })
      .catch((error) => {
        console.log("Notification fetch fallback failed:", error);
      })
      .finally(() => {
        if (isMounted && !hasRealtimeSnapshot) {
          setNotificationLoading(false);
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [notificationUserId]);

  const loadHome = async () => {
    try {
      const data = await HomeService.getHome();
      setHomeData(data);

      if (data.current_user) {
        await saveAuthUserToStore(data.current_user, "system");
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

  const unreadCount = notifications.filter((item) => item.unread).length;

  const closeNotifications = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowNotifications(false);
  };

  const handleNotificationPress = async (item: AppNotificationItem) => {
    const previousNotifications = notifications;

    try {
      if (item.unread) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === item.id
              ? { ...notification, unread: false }
              : notification,
          ),
        );
        await NotificationService.markAsRead(item.id);
      }
    } catch (error) {
      console.log("Mark notification as read failed:", error);
      setNotifications(previousNotifications);
    } finally {
      closeNotifications();
    }

    if (item.route) {
      router.push(item.route as never);
    }
  };

  const handleMarkAsReadNotification = async (item: AppNotificationItem) => {
    if (!item.unread) return;

    const previousNotifications = notifications;
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === item.id
          ? { ...notification, unread: false }
          : notification,
      ),
    );

    try {
      await NotificationService.markAsRead(item.id);
    } catch (error) {
      console.log("Swipe mark as read failed:", error);
      setNotifications(previousNotifications);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    const previousNotifications = notifications;
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, unread: false })),
    );

    try {
      await NotificationService.markAllAsRead();
    } catch (error) {
      console.log("Mark all notifications as read failed:", error);
      setNotifications(previousNotifications);
    }
  };

  const performDeleteNotification = async (item: AppNotificationItem) => {
    const previousNotifications = notifications;

    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== item.id),
    );

    try {
      await NotificationService.deleteNotification(item.id);
    } catch (error) {
      console.log("Delete notification failed:", error);
      setNotifications(previousNotifications);
    }
  };

  const handleDeleteNotification = (item: AppNotificationItem) => {
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
              <Search size={22} color="#6B7280" />
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
              <Bell size={22} color="#6B7280" />
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
          isLive={!!notificationUserId}
          onClose={closeNotifications}
          onMarkAllRead={handleMarkAllRead}
          onPressItem={handleNotificationPress}
          onMarkAsReadItem={(item) =>
            handleMarkAsReadNotification(item as AppNotificationItem)
          }
          onDeleteItem={(item) =>
            handleDeleteNotification(item as AppNotificationItem)
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
