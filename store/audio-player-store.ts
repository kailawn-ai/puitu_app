import { type CourseAudio } from "@/lib/services/audio-service";
import { createAudioPlayer } from "expo-audio";
import { create } from "zustand";

type AudioRouteParams = {
  id: string;
  courseId?: string;
  modelType?: string;
  modelId?: string;
};

const sharedAudioPlayer = createAudioPlayer(null, {
  updateInterval: 250,
  downloadFirst: true,
  keepAudioSessionActive: true,
});

interface AudioPlayerStore {
  player: ReturnType<typeof createAudioPlayer>;
  currentAudio: CourseAudio | null;
  routeParams: AudioRouteParams | null;
  isActive: boolean;
  lastLoadedUrl: string | null;
  setCurrentAudio: (audio: CourseAudio, params: AudioRouteParams) => void;
  setLastLoadedUrl: (url: string | null) => void;
  closePlayer: () => void;
}

export const useAudioPlayerStore = create<AudioPlayerStore>((set, get) => ({
  player: sharedAudioPlayer,
  currentAudio: null,
  routeParams: null,
  isActive: false,
  lastLoadedUrl: null,
  setCurrentAudio: (audio, params) =>
    set({
      currentAudio: audio,
      routeParams: params,
      isActive: true,
    }),
  setLastLoadedUrl: (url) => set({ lastLoadedUrl: url }),
  closePlayer: () => {
    const { player } = get();
    player.pause();
    set({
      currentAudio: null,
      routeParams: null,
      isActive: false,
      lastLoadedUrl: null,
    });
  },
}));
