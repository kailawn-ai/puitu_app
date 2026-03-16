import { Course } from "@/lib/services/home-service";
import { FlatList, Text, View, Dimensions } from "react-native";
import CourseCard from "./cor-card-ui";
import { useCallback, useMemo } from "react";

interface Props {
  courses: Course[];
  onPressItem?: (courseId: Course["id"]) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = 280; // Should match your CourseCard width
const GAP_WIDTH = 12; // Should match your ItemSeparator width

export default function CourseSection({ courses, onPressItem }: Props) {
  const renderItem = useCallback(({ item }: { item: Course }) => (
    <CourseCard course={item} onPress={onPressItem} />
  ), [onPressItem]);

  const keyExtractor = useCallback((item: Course) => item.id.toString(), []);

  const ItemSeparator = useCallback(() => <View style={{ width: GAP_WIDTH }} />, []);

  // Calculate snap interval (card width + gap)
  const snapInterval = useMemo(() => CARD_WIDTH + GAP_WIDTH, []);

  // Calculate snap offsets to show part of next card
  const snapToOffsets = useMemo(() => {
    return courses.map((_, index) => {
      return index * (CARD_WIDTH + GAP_WIDTH);
    });
  }, [courses]);

  if (!courses?.length) {
    return null;
  }

  return (
    <View className="mb-6">
      <Text className="font-semibold text-lg text-gray-900 dark:text-white mb-3 px-6">
        Courses
      </Text>

      <FlatList
        data={courses}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ItemSeparatorComponent={ItemSeparator}
        renderItem={renderItem}
        
        // Snapping configuration - choose one approach:
        
        // Approach 1: Simple snap to card boundaries
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate="fast"
        
        // Approach 2: Precise snap positions (uncomment to use instead)
        // snapToOffsets={snapToOffsets}
        // snapToAlignment="start"
        // decelerationRate="fast"
        
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
        initialNumToRender={3}
        
        // Additional smooth scrolling props
        bounces={false}
        overScrollMode="never"
        disableIntervalMomentum={false} // Set to false for better snapping
        pagingEnabled={false} // Don't use pagingEnabled as it conflicts with snapToInterval
      />
    </View>
  );
}