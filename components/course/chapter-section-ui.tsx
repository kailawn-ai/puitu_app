import { type Course, type Section } from "@/lib/services/course-service";
import { FlatList, Text, View } from "react-native";
import ChapterCardUI from "./chapter-card-ui";

interface ChapterSectionUIProps {
  sections?: Section[] | null;
  section?: Section | null;
  course?: Course;
  title?: string;
  emptyText?: string;
  showEmptyState?: boolean;
  showMenu?: boolean;
  onPressItem?: (section: Section) => void;
  onPressMenu?: (section: Section) => void;
}

export default function ChapterSectionUI({
  sections,
  section,
  course,
  title = "Chapters",
  emptyText = "No chapters available.",
  showEmptyState = false,
  showMenu = true,
  onPressItem,
  onPressMenu,
}: ChapterSectionUIProps) {
  const data = sections ?? (section ? [section] : []);

  if (!data.length) {
    if (!showEmptyState) {
      return null;
    }

    return (
      <View className="px-4 py-3">
        <Text className="text-zinc-400 dark:text-zinc-500 text-sm">
          {emptyText}
        </Text>
      </View>
    );
  }

  return (
    <View className="px-4 py-3 mt-2">
      {!!title && (
        <View className="mb-3 flex-row items-center">
          <Text className="text-zinc-900 dark:text-zinc-100 text-lg font-semibold">
            {title}
          </Text>
          <Text className="ml-3 px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-700 rounded-full font-medium">
            {data.length === 1 ? "1 item" : `${data.length} items`}
          </Text>
        </View>
      )}

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ChapterCardUI
            section={item}
            course={course}
            showMenu={showMenu}
            onPress={onPressItem}
            onPressMenu={onPressMenu}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        scrollEnabled={false}
      />
    </View>
  );
}
