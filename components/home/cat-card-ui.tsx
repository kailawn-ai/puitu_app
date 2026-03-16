// screen/home/components/CategoryCard.tsx
import { Category } from "@/lib/services/home-service";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface Props {
  category: Category;
  onPress?: (category: Category) => void;
}

export default function CategoryCard({ category, onPress }: Props) {
  return (
    <TouchableOpacity
      style={{ width: "50%" }}
      className="px-1 mb-2"
      activeOpacity={0.8}
      onPress={() => onPress?.(category)}
    >
      <View className="flex-row items-center bg-white dark:bg-secondary-700 p-3 rounded-xl">
        {/* Icon */}
        <View className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-primary-900/30 border border-zinc-200 dark:border-primary-800 items-center justify-center mr-3 overflow-hidden">
          <Image
            source={{ uri: category.icon }}
            className="w-7 h-7"
            resizeMode="contain"
          />
        </View>

        {/* Label */}
        <Text
          className="flex-1 text-gray-900 dark:text-white font-medium"
          numberOfLines={2}
        >
          {category.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
