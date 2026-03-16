// screen/home/components/CategorySection.tsx
import { Category } from "@/lib/services/home-service";
import { View } from "react-native";
import CategoryCard from "./cat-card-ui";

interface Props {
  categories: Category[];
  onPressItem?: (category: Category) => void;
}

export default function CategorySection({ categories, onPressItem }: Props) {
  if (!categories?.length) return null;

  return (
    <View className="px-4 mb-4 mt-4">
      <View className="flex-row flex-wrap">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} onPress={onPressItem} />
        ))}
      </View>
    </View>
  );
}
