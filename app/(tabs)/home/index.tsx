// app/(tabs)/home.tsx
import { SideDrawer } from "@/components/layout/side-drawer";
import { HamburgerMenu } from "@/components/ui/hamburger-menu";
import { useDrawer } from "@/hook/use-drawer";
import {
  Award,
  Bell,
  ChevronRight,
  Clock,
  PlayCircle,
  Search,
  Star,
  Target,
  Users,
} from "lucide-react-native";
import React from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = screenWidth * 0.75;

// Mock Data
const featuredCourses = [
  {
    id: "1",
    title: "React Native Masterclass",
    instructor: "Alex Johnson",
    duration: "12h 30m",
    students: "2.5k",
    rating: 4.9,
    price: "$89.99",
    image:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop",
    category: "Mobile Development",
    color: "#7A25FF",
  },
  {
    id: "2",
    title: "UI/UX Design Pro",
    instructor: "Sarah Miller",
    duration: "8h 15m",
    students: "1.8k",
    rating: 4.8,
    price: "$74.99",
    image:
      "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=250&fit=crop",
    category: "Design",
    color: "#10B981",
  },
  {
    id: "3",
    title: "Machine Learning Basics",
    instructor: "Dr. Robert Chen",
    duration: "15h 20m",
    students: "3.2k",
    rating: 4.7,
    price: "$99.99",
    image:
      "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop",
    category: "Data Science",
    color: "#3B82F6",
  },
];

const learningShorts = [
  {
    id: "1",
    title: "JavaScript Tips in 60s",
    views: "245k",
    duration: "1:05",
    thumbnail:
      "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=300&h=400&fit=crop",
  },
  {
    id: "2",
    title: "CSS Grid Explained",
    views: "189k",
    duration: "0:45",
    thumbnail:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
  },
  {
    id: "3",
    title: "React Hooks Guide",
    views: "312k",
    duration: "1:20",
    thumbnail:
      "https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=300&h=400&fit=crop",
  },
];

const quickStats = [
  { icon: "🎯", label: "Daily Goal", value: "3/5", progress: 60 },
  { icon: "📚", label: "Active Courses", value: "4", progress: 80 },
  { icon: "⏱️", label: "Learning Time", value: "12h", progress: 40 },
  { icon: "🏆", label: "Streak", value: "7 days", progress: 100 },
];

const topics = [
  { name: "Web Dev", color: "#7A25FF", icon: "💻" },
  { name: "Mobile", color: "#10B981", icon: "📱" },
  { name: "Design", color: "#F59E0B", icon: "🎨" },
  { name: "Data Science", color: "#3B82F6", icon: "📊" },
  { name: "Business", color: "#EC4899", icon: "💼" },
  { name: "Marketing", color: "#8B5CF6", icon: "📈" },
];

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { isDrawerVisible, openDrawer, closeDrawer } = useDrawer();

  const renderFeaturedCourse = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="mr-4 rounded-2xl overflow-hidden"
      style={{ width: cardWidth }}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.image }}
        className="w-full h-48"
        resizeMode="cover"
      />
      <View className="absolute top-4 left-4 bg-white/90 dark:bg-black/70 px-3 py-1.5 rounded-full">
        <Text className="text-xs font-semibold" style={{ color: item.color }}>
          {item.category}
        </Text>
      </View>

      <View className="p-5 bg-secondary-100 dark:bg-secondary-800">
        <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {item.title}
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 mb-4">
          By {item.instructor}
        </Text>

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center space-x-4">
            <View className="flex-row items-center">
              <Clock size={14} color="#9CA3AF" />
              <Text className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                {item.duration}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Users size={14} color="#9CA3AF" />
              <Text className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                {item.students}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                {item.rating}
              </Text>
            </View>
          </View>

          <Text className="text-lg font-bold text-primary-600 dark:text-primary-400">
            {item.price}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderLearningShort = ({ item }: { item: any }) => (
    <TouchableOpacity className="mr-4" activeOpacity={0.9}>
      <View className="relative">
        <Image
          source={{ uri: item.thumbnail }}
          className="w-40 h-56 rounded-xl"
          resizeMode="cover"
        />
        <View className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded">
          <Text className="text-white text-xs">{item.duration}</Text>
        </View>
        <View className="absolute top-2 left-2 w-10 h-10 bg-primary-500 rounded-full items-center justify-center">
          <PlayCircle size={20} color="#FFFFFF" />
        </View>
      </View>
      <Text className="text-gray-900 dark:text-white font-semibold mt-2 max-w-40">
        {item.title}
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 text-sm">
        {item.views} views
      </Text>
    </TouchableOpacity>
  );

  const renderStatCard = (stat: any, index: number) => (
    <View
      key={index}
      className="flex-1 bg-secondary-50 dark:bg-secondary-800 rounded-2xl p-4 mx-1"
      style={{ minWidth: screenWidth * 0.45 }}
    >
      <Text className="text-2xl mb-2">{stat.icon}</Text>
      <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1">
        {stat.label}
      </Text>
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        {stat.value}
      </Text>
      <View className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${stat.progress}%`,
            backgroundColor: stat.progress === 100 ? "#10B981" : "#7A25FF",
          }}
        />
      </View>
    </View>
  );

  const renderTopicCard = (topic: any, index: number) => (
    <TouchableOpacity
      key={index}
      className="items-center justify-center mx-2"
      activeOpacity={0.7}
    >
      <View
        className="w-20 h-20 rounded-2xl items-center justify-center mb-2"
        style={{ backgroundColor: `${topic.color}15` }} // 15 = 0.1 opacity
      >
        <Text className="text-2xl">{topic.icon}</Text>
      </View>
      <Text className="text-gray-900 dark:text-white font-medium">
        {topic.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background dark:bg-background-dark ">
      {/* Header */}
      <View className="px-5 pt-4 pb-4" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center">
            <HamburgerMenu onPress={openDrawer} />
            <View className="ml-4">
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back! 👋
              </Text>
              <Text className="text-gray-600 dark:text-gray-400">
                Continue your learning journey
              </Text>
            </View>
          </View>

          <View className="flex-row items-center space-x-3">
            <TouchableOpacity className="p-2 bg-white dark:bg-secondary-800 rounded-xl">
              <Search size={22} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2 bg-white dark:bg-secondary-800 rounded-xl relative">
              <Bell size={22} color="#6B7280" />
              <View className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-2"
        >
          {quickStats.map(renderStatCard)}
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Featured Courses Section */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center px-5 mb-4">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">
              Featured Courses
            </Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-primary-600 dark:text-primary-400 font-medium mr-1">
                View All
              </Text>
              <ChevronRight size={16} color="#7A25FF" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={featuredCourses}
            renderItem={renderFeaturedCourse}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            snapToInterval={cardWidth + 16}
            decelerationRate="fast"
          />
        </View>

        {/* Learning Shorts Section */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center px-5 mb-4">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">
              Learning Shorts
            </Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-primary-600 dark:text-primary-400 font-medium mr-1">
                Explore
              </Text>
              <ChevronRight size={16} color="#7A25FF" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={learningShorts}
            renderItem={renderLearningShort}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          />
        </View>

        {/* Topics Section */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center px-5 mb-4">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">
              Browse Topics
            </Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-primary-600 dark:text-primary-400 font-medium mr-1">
                See All
              </Text>
              <ChevronRight size={16} color="#7A25FF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {topics.map(renderTopicCard)}
          </ScrollView>
        </View>

        {/* Daily Goal Card */}
        <View className="mx-5 mb-8">
          <View className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-3xl p-6">
            <Text className="text-white text-2xl font-bold mb-2">
              Daily Learning Goal
            </Text>
            <Text className="text-primary-100 mb-6">
              Complete 5 lessons today to keep your streak alive!
            </Text>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center space-x-2">
                <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
                  <Target size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text className="text-white font-semibold">Progress</Text>
                  <Text className="text-primary-200 text-sm">
                    3/5 completed
                  </Text>
                </View>
              </View>

              <TouchableOpacity className="bg-white px-6 py-3 rounded-xl">
                <Text className="text-primary-600 font-semibold">Continue</Text>
              </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View className="mt-6">
              <View className="flex-row justify-between mb-2">
                <Text className="text-white text-sm">60% complete</Text>
                <Text className="text-primary-200 text-sm">2 lessons left</Text>
              </View>
              <View className="h-2 bg-white/30 rounded-full overflow-hidden">
                <View className="h-full w-3/5 bg-white rounded-full" />
              </View>
            </View>
          </View>
        </View>

        {/* Achievement Card */}
        <View className="mx-5 mb-8">
          <View className="bg-secondary-100 dark:bg-secondary-800 rounded-3xl p-6 shadow-sm">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                Your Achievements
              </Text>
              <Award size={24} color="#F59E0B" />
            </View>

            <View className="flex-row items-center space-x-4">
              <View className="items-center">
                <View className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl items-center justify-center mb-2">
                  <Text className="text-2xl">🏆</Text>
                </View>
                <Text className="text-gray-900 dark:text-white font-semibold">
                  7
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-xs">
                  Badges
                </Text>
              </View>

              <View className="items-center">
                <View className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl items-center justify-center mb-2">
                  <Text className="text-2xl">📚</Text>
                </View>
                <Text className="text-gray-900 dark:text-white font-semibold">
                  12
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-xs">
                  Courses
                </Text>
              </View>

              <View className="items-center">
                <View className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl items-center justify-center mb-2">
                  <Text className="text-2xl">⚡</Text>
                </View>
                <Text className="text-gray-900 dark:text-white font-semibold">
                  42
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-xs">
                  Streak
                </Text>
              </View>
            </View>

            <TouchableOpacity className="mt-6 flex-row items-center justify-center bg-gray-100 dark:bg-gray-700 py-3 rounded-xl">
              <Text className="text-gray-700 dark:text-gray-300 font-medium mr-2">
                View All Achievements
              </Text>
              <ChevronRight size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mx-5 mb-20">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </Text>

          <View className="flex-row flex-wrap -mx-1">
            {[
              { icon: "📖", label: "Continue Learning", color: "#7A25FF" },
              { icon: "🎯", label: "Set Goals", color: "#10B981" },
              { icon: "📝", label: "Take Notes", color: "#3B82F6" },
              { icon: "👥", label: "Community", color: "#EC4899" },
            ].map((action, index) => (
              <TouchableOpacity
                key={index}
                className="w-1/2 px-1 mb-2"
                activeOpacity={0.7}
              >
                <View className="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-xl">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mb-3"
                    style={{ backgroundColor: `${action.color}15` }}
                  >
                    <Text className="text-xl">{action.icon}</Text>
                  </View>
                  <Text className="text-gray-900 dark:text-white font-medium">
                    {action.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      <SideDrawer isVisible={isDrawerVisible} onClose={closeDrawer} />
    </View>
  );
};

export default HomeScreen;
