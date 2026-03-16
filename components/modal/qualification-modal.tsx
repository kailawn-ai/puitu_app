import {
  Qualification,
  qualificationService,
} from "@/lib/services/qualification-service";
import { useAlert } from "@/providers/alert-provider";
import { Check, Search, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Qualifications</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.modalCloseBtn}
            >
              <X color="#fff" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search color="#888" size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search qualifications..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          <FlatList
            style={{ flex: 1 }}
            data={qualifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.qualificationItem,
                  selected.includes(item.id) &&
                    styles.qualificationItemSelected,
                ]}
                onPress={() => toggleQualification(item.id)}
              >
                <View style={styles.qualificationInfo}>
                  <Text
                    style={[
                      styles.qualificationName,
                      selected.includes(item.id) &&
                        styles.qualificationNameSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.description && (
                    <Text
                      style={styles.qualificationDescription}
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
                <ActivityIndicator style={styles.loader} color="#a855f7" />
              ) : null
            }
            ListEmptyComponent={() =>
              !loading && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No qualifications found</Text>
                </View>
              )
            }
            contentContainerStyle={styles.listContent}
          />

          <View
            style={[styles.modalFooter, { paddingBottom: insets.bottom + 15 }]}
          >
            <Text style={styles.selectedCount}>{selected.length} selected</Text>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#a855f7",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  modalCloseBtn: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f5f5f5",
    margin: 15,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#333",
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  qualificationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    marginBottom: 8,
  },
  qualificationItemSelected: {
    backgroundColor: "#a855f7",
  },
  qualificationInfo: {
    flex: 1,
    marginRight: 10,
  },
  qualificationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  qualificationNameSelected: {
    color: "#fff",
  },
  qualificationDescription: {
    fontSize: 12,
    color: "#666",
  },
  loader: {
    marginVertical: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  selectedCount: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#a855f7",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default QualificationModal;
