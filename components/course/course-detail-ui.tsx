import CourseDescriptionSheet from "@/components/course/course-description-sheet";
import InstructorDetailSheet from "@/components/course/instructor-detail-sheet";
import EngagementBar from "@/components/ui/engagement-button";
import { CourseInteractionService } from "@/lib/services/course-interaction-service";
import { type Course } from "@/lib/services/course-service";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Share,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import InstructorCardUI from "./instructor-card-ui";

interface CourseDetailUIProps {
  course: Course;
}

export default function CourseDetailUI({ course }: CourseDetailUIProps) {
  const [likesCount, setLikesCount] = useState(course.likes_count ?? 0);
  const [isLiked, setIsLiked] = useState(course.is_liked ?? false);
  const [isSaved, setIsSaved] = useState(course.is_saved ?? false);
  const [userRating, setUserRating] = useState(course.user_rating ?? 0);
  const [descriptionVisible, setDescriptionVisible] = useState(false);
  const [instructorVisible, setInstructorVisible] = useState(false);

  useEffect(() => {
    setLikesCount(course.likes_count ?? 0);
    setIsLiked(course.is_liked ?? false);
    setIsSaved(course.is_saved ?? false);
    setUserRating(course.user_rating ?? 0);
  }, [
    course.id,
    course.likes_count,
    course.is_liked,
    course.is_saved,
    course.user_rating,
  ]);

  const handleLike = async (liked: boolean): Promise<void> => {
    const previousLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(liked);
    setLikesCount((prev) => (liked ? prev + 1 : Math.max(prev - 1, 0)));

    try {
      await CourseInteractionService.toggleLike(course.id);
    } catch (error) {
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      console.error("Failed to toggle like", error);
    }
  };

  const handleSave = async (saved: boolean): Promise<void> => {
    const previousSaved = isSaved;
    setIsSaved(saved);

    try {
      await CourseInteractionService.toggleSave(course.id);
      ToastAndroid.show(
        saved ? "Course saved" : "Course removed from saved",
        ToastAndroid.SHORT,
      );
    } catch (error) {
      setIsSaved(previousSaved);
      console.error("Failed to toggle save", error);
    }
  };

  const handleRate = async (rating: number): Promise<void> => {
    const previousRating = userRating;
    setUserRating(rating);

    try {
      await CourseInteractionService.rateCourse(course.id, rating);
      ToastAndroid.show("Rating submitted", ToastAndroid.SHORT);
    } catch (error) {
      setUserRating(previousRating);
      console.error("Failed to rate course", error);
    }
  };

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View className="pl-3 pr-3">
          <Image
            source={{ uri: course.thumbnail_url }}
            className="w-full h-56 rounded-2xl"
            resizeMode="cover"
          />
        </View>

        <View className="p-3">
          <Text className="text-2xl font-bold text-black dark:text-white">
            {course.title}
          </Text>

          <View className="mt-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
            <Text
              numberOfLines={3}
              className="text-gray-700 dark:text-gray-300 leading-6"
            >
              {course.summary || "No description yet."}
            </Text>

            <TouchableOpacity
              onPress={() => setDescriptionVisible(true)}
              className="mt-3"
            >
              <Text className="text-blue-500 font-semibold">show more</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ScrollView
        horizontal
        nestedScrollEnabled
        directionalLockEnabled
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: "center",
          columnGap: 8,
          paddingVertical: 2,
          paddingLeft: 10,
          paddingRight: 12,
        }}
      >
        <InstructorCardUI
          instructor={course.user}
          onPress={() => setInstructorVisible(true)}
        />

        <View className="shrink-0 -mt-3">
          <EngagementBar
            liked={isLiked}
            likeCount={likesCount}
            saved={isSaved}
            rating={userRating}
            onLike={handleLike}
            onSave={handleSave}
            onRate={handleRate}
            onShare={() => {
              Share.share({
                message: `Check out this course: ${course.title}`,
              });
            }}
          />
        </View>
      </ScrollView>

      <CourseDescriptionSheet
        visible={descriptionVisible}
        onClose={() => setDescriptionVisible(false)}
        summary={course.summary}
        likesCount={likesCount}
        viewsCount={course.views_count ?? 0}
        createdAt={course.created_at}
      />

      <InstructorDetailSheet
        visible={instructorVisible}
        onClose={() => setInstructorVisible(false)}
        instructor={course.user}
        createdAt={course.created_at}
      />
    </View>
  );
}
