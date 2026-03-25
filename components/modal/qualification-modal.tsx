import {
  Qualification,
  qualificationService,
} from "@/lib/services/qualification-service";
import { useAlert } from "@/providers/alert-provider";
import { Check, Search, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface QualificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (ids: number[]) => void;
  selectedIds: number[];
}

const QualificationModal = ({
  visible,
  onClose,
  onSelect,
  selectedIds,
}: QualificationModalProps) => {
  const insets = useSafeAreaInsets();
  const alert = useAlert();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState("");
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selected, setSelected] = useState<number[]>(selectedIds);

  const fetchQualifications = async (
    search: string = "",
    pageNum: number = 1,
  ) => {
    if (loading || (!hasMore && pageNum > 1)) return;

    setLoading(true);
    try {
      const response = await qualificationService.getPublic({
        search: search || undefined,
        per_page: 10,
      });

      if (pageNum === 1) {
        setQualifications(response);
      } else {
        setQualifications((prev) => [...prev, ...response]);
      }

      setHasMore(response.current_page < response.last_page);
      setPage(pageNum);
    } catch (error) {
      alert.showError("Error ", `${error}`);
      ToastAndroid.show("Failed to load qualifications", ToastAndroid.SHORT);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setSelected(selectedIds);
      fetchQualifications();
    }
  }, [visible, selectedIds]);

  useEffect(() => {
    Animated.timing(backdropOpacity, {
      toValue: visible ? 0.8 : 0,
      duration: visible ? 220 : 160,
      useNativeDriver: true,
    }).start();
  }, [backdropOpacity, visible]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setQualifications([]);
    setPage(1);
    setHasMore(true);
    fetchQualifications(text, 1);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchQualifications(searchQuery, page + 1);
    }
  };

  const toggleQualification = (id: number) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSave = () => {
    onSelect(selected);
    onClose();
  };

  const handleClose = () => {
    setSelected(selectedIds);
    onClose();
  };

  const selectedQualifications = selected.map((id) => {
    const qualification = qualifications.find((item) => item.id === id);

    return {
      id,
      name: qualification?.name ?? `Qualification ${id}`,
    };
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-end">
        <Animated.View
          pointerEvents="none"
          className="absolute inset-0 bg-black"
          style={{ opacity: backdropOpacity }}
        />
        <View className="h-4/5 rounded-t-[32px] border border-slate-200 bg-white shadow-hard dark:border-secondary-700 dark:bg-secondary-900">
          <View className="flex-row items-center justify-between rounded-t-[32px] border-b border-slate-200 bg-slate-50 px-5 py-5 dark:border-secondary-700 dark:bg-secondary-800">
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              Select Qualifications
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-secondary-700"
            >
              <X color={isDarkMode ? "#E2E8F0" : "#0F172A"} size={20} />
            </TouchableOpacity>
          </View>

          <View className="mx-4 my-4 flex-row items-center rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-1 dark:border-secondary-700 dark:bg-secondary-800">
            <Search color={isDarkMode ? "#94A3B8" : "#737373"} size={20} />
            <TextInput
              className="ml-2.5 h-11 flex-1 text-base text-slate-900 dark:text-white"
              placeholder="Search qualifications..."
              placeholderTextColor={isDarkMode ? "#94A3B8" : "#737373"}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          {selectedQualifications.length > 0 && (
            <View className="mb-3 pl-4">
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={selectedQualifications}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View className="mr-2 flex-row items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-2 dark:border-primary/30 dark:bg-primary/15">
                    <Text
                      className="max-w-[160px] text-sm font-medium text-primary dark:text-primary-200"
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <TouchableOpacity
                      className="ml-2 h-5 w-5 items-center justify-center rounded-full bg-primary/15 dark:bg-primary/25"
                      onPress={() => toggleQualification(item.id)}
                    >
                      <X color={isDarkMode ? "#C4B5FD" : "#4A00B3"} size={12} />
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}

          <FlatList
            className="flex-1"
            data={qualifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`mb-2 flex-row items-center justify-between rounded-2xl border px-4 py-4 ${
                  selected.includes(item.id)
                    ? "border-primary bg-primary"
                    : "border-slate-200 bg-white dark:border-secondary-700 dark:bg-secondary-800"
                }`}
                onPress={() => toggleQualification(item.id)}
              >
                <View className="mr-2.5 flex-1">
                  <Text
                    className={`mb-1 text-base font-semibold ${
                      selected.includes(item.id)
                        ? "text-white"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {item.name}
                  </Text>
                  {item.description && (
                    <Text
                      className={`text-xs ${
                        selected.includes(item.id)
                          ? "text-primary-100"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                      numberOfLines={1}
                    >
                      {item.description}
                    </Text>
                  )}
                </View>
                {selected.includes(item.id) && <Check color="#fff" size={20} />}
              </TouchableOpacity>
            )}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={() =>
              loading ? (
                <ActivityIndicator className="my-5" color="#7A25FF" />
              ) : null
            }
            ListEmptyComponent={() =>
              !loading && (
                <View className="items-center justify-center px-10 py-10">
                  <Text className="text-base text-slate-500 dark:text-slate-400">
                    No qualifications found
                  </Text>
                </View>
              )
            }
            contentContainerClassName="px-4 pb-5"
          />

          <View
            className="flex-row items-center justify-between border-t border-slate-200 bg-white px-4 pt-4 dark:border-secondary-700 dark:bg-secondary-900"
            style={{ paddingBottom: insets.bottom + 10 }}
          >
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {selected.length} selected
            </Text>
            <TouchableOpacity
              className="rounded-full bg-primary px-8 py-3 shadow-button"
              onPress={handleSave}
            >
              <Text className="text-base font-semibold text-text-light">
                Select
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default QualificationModal;
