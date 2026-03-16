import {
  FileText,
  Headphones,
  Image as ImageIcon,
  Video,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type ViewStyle,
} from "react-native";

export type SectionMediaTabKey = "videos" | "documents" | "audios" | "images";

export interface SectionMediaTabItem {
  key: SectionMediaTabKey;
  label: string;
}

interface SectionTabsProps {
  value: SectionMediaTabKey;
  onChange: (next: SectionMediaTabKey) => void;
  tabs?: SectionMediaTabItem[];
  style?: ViewStyle;
}

const DEFAULT_TABS: SectionMediaTabItem[] = [
  { key: "videos", label: "Video" },
  { key: "documents", label: "Document" },
  { key: "audios", label: "Audio" },
  { key: "images", label: "Images" },
];

const iconByTab: Record<
  SectionMediaTabKey,
  React.ComponentType<{ size?: number; color?: string }>
> = {
  videos: Video,
  documents: FileText,
  audios: Headphones,
  images: ImageIcon,
};

const SectionTabs: React.FC<SectionTabsProps> = ({
  value,
  onChange,
  tabs = DEFAULT_TABS,
  style,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={style} className="w-full">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2.5 py-1 px-3"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === value;
          const Icon = iconByTab[tab.key];

          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              className={[
                "min-h-[42px] rounded-full px-4 py-2.5 flex-row items-center justify-center gap-2",
                isActive ? "bg-primary-600" : "bg-white dark:bg-zinc-800",
              ].join(" ")}
              style={({ pressed }) => (pressed ? { opacity: 0.8 } : undefined)}
            >
              <Icon
                size={15}
                color={isActive ? "#FFFFFF" : isDark ? "#E4E4E7" : "#6B7280"}
              />
              <Text
                className={[
                  "text-base font-semibold",
                  isActive ? "text-white" : "text-zinc-700 dark:text-zinc-200",
                ].join(" ")}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export { DEFAULT_TABS };
export default SectionTabs;
