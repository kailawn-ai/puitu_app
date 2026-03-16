import { Job } from "@/lib/services/home-service";
import { FlatList, Text, View } from "react-native";
import JobCard from "./job-card-ui";

interface Props {
  jobs: Job[];
  onPress?: (job: Job) => void;
}

export default function JobSection({ jobs, onPress }: Props) {
  if (!jobs?.length) return null;

  return (
    <View className="mb-6">
      <Text className="font-semibold text-lg text-gray-900 dark:text-white mb-3 px-6">
        Job Vacancy
      </Text>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        decelerationRate="fast"
        snapToAlignment="start"
        renderItem={({ item }) => <JobCard job={item} onPress={onPress} />}
      />
    </View>
  );
}
