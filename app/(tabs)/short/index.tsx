import { useIsFocused } from "@react-navigation/native";
import { useEvent } from "expo";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Play,
  Send,
} from "lucide-react-native";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

type ShortVideoItem = {
  id: string;
  title: string;
  creator: string;
  caption: string;
  audio: string;
  likes: number;
  comments: number;
  shares: number;
  source: string;
};

const SHORT_VIDEOS: ShortVideoItem[] = [
  {
    id: "short-1",
    title: "Biology in 30 seconds",
    creator: "@puitu.bio",
    caption: "Quick cell structure revision for entrance prep.",
    audio: "Original audio",
    likes: 1240,
    comments: 94,
    shares: 41,
    source: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    id: "short-2",
    title: "Physics shortcut",
    creator: "@puitu.physics",
    caption: "A fast trick to remember motion equations for exam time.",
    audio: "Study Mix",
    likes: 986,
    comments: 58,
    shares: 23,
    source:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  },
  {
    id: "short-3",
    title: "Quiz challenge",
    creator: "@puitu.quiz",
    caption: "Can you answer this NEET-style question before the timer ends?",
    audio: "Challenge beat",
    likes: 2110,
    comments: 188,
    shares: 72,
    source:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
  {
    id: "short-4",
    title: "Community teaser",
    creator: "@puitu.community",
    caption: "Join a study circle, chat live, and solve together.",
    audio: "Puitu original",
    likes: 734,
    comments: 31,
    shares: 19,
    source:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  },
  {
    id: "short-5",
    title: "Old question hack",
    creator: "@puitu.archive",
    caption: "Use previous-year patterns to predict what matters most.",
    audio: "Focus mode",
    likes: 1598,
    comments: 104,
    shares: 66,
    source:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  },
];

const formatCount = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
};

function ShortCard({
  item,
  isActive,
  isScreenFocused,
  topInset,
  tabBarHeight,
}: {
  item: ShortVideoItem;
  isActive: boolean;
  isScreenFocused: boolean;
  topInset: number;
  tabBarHeight: number;
}) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const player = useVideoPlayer(item.source, (instance) => {
    instance.loop = true;
  });

  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  React.useEffect(() => {
    if (isActive && isScreenFocused) {
      player.play();
      return;
    }

    player.pause();
    player.currentTime = 0;
  }, [isActive, isScreenFocused, player]);

  const displayLikes = useMemo(
    () => item.likes + (liked ? 1 : 0),
    [item.likes, liked],
  );
  const topContentInset = topInset + 5;
  const bottomContentInset = tabBarHeight;

  return (
    <View
      style={[
        styles.page,
        {
          paddingTop: topContentInset,
          paddingBottom: bottomContentInset,
        },
      ]}
    >
      <Pressable
        style={[
          styles.videoLayer,
          {
            top: topContentInset,
            bottom: bottomContentInset,
          },
        ]}
        onPress={() => {
          if (isPlaying) {
            player.pause();
          } else {
            player.play();
          }
        }}
      >
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          nativeControls={false}
          contentFit="cover"
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      </Pressable>

      {!isPlaying && (
        <View
          pointerEvents="none"
          style={[
            styles.centerOverlay,
            {
              top: topContentInset,
              bottom: bottomContentInset,
            },
          ]}
        >
          <View className="h-20 w-20 items-center justify-center rounded-full bg-black/35">
            <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </View>
      )}

      <View className="flex-1 justify-between px-2">
        <View className="flex-row items-start justify-between pt-3">
          <View className="rounded-full bg-black/35 px-4 py-2.5">
            <Text className="text-xs font-semibold uppercase tracking-[2px] text-white/90">
              Puitu Shorts
            </Text>
          </View>

          <View className="rounded-full bg-black/35 px-4 py-2.5">
            <Text className="text-xs font-medium text-white/90">
              Hardcoded demo
            </Text>
          </View>
        </View>

        <View className="flex-row items-end">
          <View className="mr-4 flex-1 rounded-[28px] bg-black/28 px-2">
            <View className="flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-500">
                <Text className="text-sm font-bold text-white">
                  {item.creator.replace("@", "").slice(0, 2).toUpperCase()}
                </Text>
              </View>

              <View className="ml-2 flex-row items-center">
                <Text className="text-base font-semibold text-white">
                  {item.creator}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.9}
                  className="ml-3 rounded-full border border-white/25 bg-white/10 px-4 py-2.5"
                  onPress={() =>
                    Alert.alert(
                      "Follow creator",
                      "We can wire creator follow later when backend is ready.",
                    )
                  }
                >
                  <Text className="text-sm font-semibold text-white">
                    Follow
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text className="mt-1 text-lg font-semibold leading-7 text-white">
              {item.title}
            </Text>
          </View>

          <View className="items-center">
            <TouchableOpacity
              activeOpacity={0.88}
              className="mb-2 items-center"
              onPress={() => setLiked((prev) => !prev)}
            >
              <View className="h-14 w-14 items-center justify-center rounded-full bg-black/40">
                <Heart
                  size={26}
                  color={liked ? "#FB7185" : "#FFFFFF"}
                  fill={liked ? "#FB7185" : "transparent"}
                />
              </View>
              <Text className="mt-2 text-xs font-semibold text-white">
                {formatCount(displayLikes)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              className="mb-2 items-center"
              onPress={() =>
                Alert.alert(
                  "Comments",
                  "Comment sheet can be connected once realtime chat/comment backend is ready.",
                )
              }
            >
              <View className="h-14 w-14 items-center justify-center rounded-full bg-black/40">
                <MessageCircle size={25} color="#FFFFFF" />
              </View>
              <Text className="mt-2 text-xs font-semibold text-white">
                {formatCount(item.comments)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              className="mb-2 items-center"
              onPress={() =>
                Alert.alert(
                  "Share short",
                  "Share flow can be wired to native share or deep links next.",
                )
              }
            >
              <View className="h-14 w-14 items-center justify-center rounded-full bg-black/40">
                <Send size={24} color="#FFFFFF" />
              </View>
              <Text className="mt-2 text-xs font-semibold text-white">
                {formatCount(item.shares)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              className="items-center"
              onPress={() => setBookmarked((prev) => !prev)}
            >
              <View className="h-14 w-14 items-center justify-center rounded-full bg-black/40">
                <Bookmark
                  size={24}
                  color="#FFFFFF"
                  fill={bookmarked ? "#FFFFFF" : "transparent"}
                />
              </View>
              <Text className="mt-2 text-xs font-semibold text-white">
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ShortScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const isFocused = useIsFocused();
  const [activeIndex, setActiveIndex] = useState(0);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<ShortVideoItem>[] }) => {
      if (!viewableItems.length) return;

      const firstVisible = viewableItems[0]?.index ?? 0;
      setActiveIndex(firstVisible);
    },
  );

  return (
    <View className="flex-1 bg-black">
      <FlatList
        data={SHORT_VIDEOS}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ShortCard
            item={item}
            isActive={index === activeIndex}
            isScreenFocused={isFocused}
            topInset={insets.top}
            tabBarHeight={tabBarHeight}
          />
        )}
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        showsVerticalScrollIndicator={false}
        bounces={false}
        initialNumToRender={2}
        windowSize={3}
        removeClippedSubviews
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#141414",
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  videoLayer: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});
