import { Job } from "@/lib/services/home-service";
import { Image, TouchableOpacity, View } from "react-native";

interface Props {
  job: Job;
  onPress?: (job: Job) => void;
}

export default function JobCard({ job, onPress }: Props) {
  return (
    <TouchableOpacity
      style={{ width: 350, height: 220 }}
      className="mb-2"
      activeOpacity={0.9}
      onPress={() => onPress?.(job)}
    >
      <View className="bg-white dark:bg-secondary-700 rounded-sm elevation-sm">
        {/* Shadow wrapper for iOS shadow consistency */}
        <View className="shadow-xl shadow-black/10 dark:shadow-none">
          {/* Image Container with Gradient Overlay */}
          <View className="relative h-46">
            <Image
              source={{ uri: job.image }}
              className="w-full h-full rounded-sm"
              resizeMode="cover"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
