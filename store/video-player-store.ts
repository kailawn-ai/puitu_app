import { type CourseVideo } from "@/lib/services/video-service";
import { createVideoPlayer } from "expo-video";
import { create } from "zustand";

type VideoRouteParams = {
  id: string;
  courseId?: string;
  modelType?: string;
  modelId?: string;
};

const sharedVideoPlayer = createVideoPlayer(null);
sharedVideoPlayer.loop = false;
sharedVideoPlayer.volume = 1;
sharedVideoPlayer.staysActiveInBackground = true;
sharedVideoPlayer.showNowPlayingNotification = true;
sharedVideoPlayer.timeUpdateEventInterval = 0.5;

interface VideoPlayerStore {
  player: ReturnType<typeof createVideoPlayer>;
  currentVideo: CourseVideo | null;
  routeParams: VideoRouteParams | null;
  isActive: boolean;
  lastLoadedUrl: string | null;
  setCurrentVideo: (video: CourseVideo, params: VideoRouteParams) => void;
  setLastLoadedUrl: (url: string | null) => void;
  closePlayer: () => void;
}

export const useVideoPlayerStore = create<VideoPlayerStore>((set, get) => ({
  player: sharedVideoPlayer,
  currentVideo: null,
  routeParams: null,
  isActive: false,
  lastLoadedUrl: null,
  setCurrentVideo: (video, params) =>
    set({
      currentVideo: video,
      routeParams: params,
      isActive: true,
    }),
  setLastLoadedUrl: (url) => set({ lastLoadedUrl: url }),
  closePlayer: () => {
    const { player } = get();
    player.pause();
    set({
      currentVideo: null,
      routeParams: null,
      isActive: false,
      lastLoadedUrl: null,
    });
  },
}));
