import { Search } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { TextInput, View } from "react-native";

interface CommunitySearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function CommunitySearchBar({
  value,
  onChangeText,
  placeholder = "Search communities",
}: CommunitySearchBarProps) {
  const { colorScheme } = useColorScheme();

  return (
    <View className="flex-row items-center rounded-[30px] border border-slate-200 bg-white px-4 py-1 dark:border-secondary-700 dark:bg-secondary-900">
      <Search
        size={18}
        color={colorScheme === "dark" ? "#CBD5E1" : "#475569"}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colorScheme === "dark" ? "#94A3B8" : "#64748B"}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        selectionColor={colorScheme === "dark" ? "#FFFFFF" : "#0F172A"}
        underlineColorAndroid="transparent"
        className="ml-3 h-12 flex-1 text-base text-slate-900 dark:text-white"
      />
    </View>
  );
}
