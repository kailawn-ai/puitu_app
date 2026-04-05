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
import { useFocusEffect, useRouter } from "expo-router";
import { Bell, Search } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
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
  const [shouldRenderNotifications, setShouldRenderNotifications] =
    useState(false);
  const [homeData, setHomeData] = useState<HomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const isLoadingHomeRef = useRef(false);
  const notificationAnimation = React.useRef(new Animated.Value(0)).current;
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

  const loadHome = useCallback(
    async ({ showLoader = false }: { showLoader?: boolean } = {}) => {
      if (isLoadingHomeRef.current) return;

      isLoadingHomeRef.current = true;

      if (showLoader) {
        setLoading(true);
      }

      try {
        const data = await HomeService.getHome();
        setHomeData(data);

        if (data.current_user) {
          await saveAuthUserToStore(data.current_user, "system");
        }

        await refreshNotifications();
      } catch (e) {
        console.log("Home load error:", e);
      } finally {
        isLoadingHomeRef.current = false;
        setLoading(false);
      }
    },
    [refreshNotifications],
  );

  useEffect(() => {
    void loadHome({ showLoader: true });
  }, [loadHome]);

  useFocusEffect(
    useCallback(() => {
      void loadHome({ showLoader: !homeData });
    }, [homeData, loadHome]),
  );

  useEffect(() => {
    if (showNotifications) {
      setShouldRenderNotifications(true);
      void refreshNotifications();
    }

    Animated.timing(notificationAnimation, {
      toValue: showNotifications ? 1 : 0,
      duration: showNotifications ? 260 : 180,
      easing: showNotifications
        ? Easing.out(Easing.cubic)
        : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !showNotifications) {
        setShouldRenderNotifications(false);
      }
    });
  }, [notificationAnimation, refreshNotifications, showNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHome();
    setRefreshing(false);
  };

  const closeNotifications = () => {
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

      if (router.canGoBack()) {
        router.back();
      }
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => subscription.remove();
  }, [router, showNotifications]);

  return (
    <View className="flex-1 bg-slate-100 dark:bg-background-ddark">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="bg-slate-100/10 dark:bg-background-ddark"
      >
        <View className="px-5 flex-row justify-between items-center mb-2">
          <View className="flex-row items-center">
            <HamburgerMenu />
            <View className="ml-4">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                Welcome back! 👋
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 text-xs">
                Continue your learning journey
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.push("/search")}
              className="mr-2 p-4 bg-white dark:bg-secondary-700 rounded-2xl"
            >
              <Search size={24} color={isDarkMode ? "#FFFFFF" : "#09090b"} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowNotifications((prev) => !prev);
              }}
              className="p-4 bg-white dark:bg-secondary-700 rounded-2xl relative"
            >
              <Bell size={24} color={isDarkMode ? "#FFFFFF" : "#09090b"} />
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
                const categorySlug = cat.slug?.toLowerCase() ?? "";
                const categoryName = cat.name?.toLowerCase() ?? "";

                if (categorySlug === "courses" || categoryName === "courses") {
                  router.push("/course");
                  return;
                }

                if (
                  categorySlug === "quiz" ||
                  categorySlug === "quizzes" ||
                  categoryName === "quiz" ||
                  categoryName === "quizzes"
                ) {
                  router.push("/quiz");
                  return;
                }

                if (
                  categorySlug.includes("old-question") ||
                  categorySlug.includes("old_question") ||
                  (categoryName.includes("old") &&
                    categoryName.includes("question"))
                ) {
                  router.push("/old-question");
                  return;
                }

                if (
                  categorySlug.includes("job") ||
                  categorySlug.includes("vacancy") ||
                  categoryName.includes("job") ||
                  categoryName.includes("vacancy")
                ) {
                  router.push("/job");
                  return;
                }

                console.log("Pressed category:", cat.name);
              }}
            />

            {/* Future sections */}
            <CourseSection courses={homeData.courses} />

            <OldQuestionsSection
              questions={homeData.old_questions}
              onPressSeeAll={() => {
                router.push("/old-question");
              }}
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

      {shouldRenderNotifications && (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 40,
          }}
        >
          <Pressable
            onPress={closeNotifications}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
          >
            <Animated.View
              pointerEvents="none"
              style={{
                flex: 1,
                backgroundColor: "#020617",
                opacity: notificationAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.14],
                }),
              }}
            />
          </Pressable>

          <Animated.View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              top: insets.top + 72,
              right: 0,
              left: 0,
              opacity: notificationAnimation,
              transform: [
                {
                  translateY: notificationAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-18, 0],
                  }),
                },
                {
                  scale: notificationAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1],
                  }),
                },
              ],
            }}
          >
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
                handleMarkAsReadNotification(
                  item as (typeof notifications)[number],
                )
              }
              onDeleteItem={(item) =>
                handleDeleteNotification(item as (typeof notifications)[number])
              }
            />
          </Animated.View>
        </View>
      )}
    </View>
  );
};

export default HomeScreen;
