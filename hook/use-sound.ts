import { Audio } from "expo-av";
import { useCallback, useEffect, useRef, useState } from "react";

// Define sound types
export type SoundType = "click" | "swipe" | "success" | "error";

// Sound files mapping with platform-specific handling
const SOUND_FILES = {
  click: require("../assets/sounds/click.mp3"),
  swipe: require("../assets/sounds/swipe.mp3"),
  success: require("../assets/sounds/success.mp3"),
  error: require("../assets/sounds/error.mp3"),
};

// Optional: Add haptic feedback mapping
export type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "error"
  | "selection";

export const useSound = (options?: { enabled?: boolean; volume?: number }) => {
  // Store loaded sounds
  const sounds = useRef<Map<SoundType, Audio.Sound>>(new Map());
  const [isEnabled, setIsEnabled] = useState(options?.enabled ?? true);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastPlayed = useRef<Map<string, number>>(new Map());

  // Load all sounds on mount
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      await loadSounds();
      if (isMounted) {
        setIsLoaded(true);
      }
    };

    load();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      unloadSounds();
    };
  }, []);

  const loadSounds = async () => {
    try {
      // Configure audio mode for proper playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true, // Important for iOS silent mode
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const entries = Object.entries(SOUND_FILES) as [SoundType, any][];

      for (const [type, file] of entries) {
        const { sound } = await Audio.Sound.createAsync(file, {
          shouldPlay: false,
          volume: options?.volume ?? 0.5,
        });
        sounds.current.set(type, sound);
      }

      console.log("✅ Sounds loaded successfully");
    } catch (error) {
      console.log("❌ Error loading sounds:", error);
    }
  };

  const unloadSounds = async () => {
    const unloadPromises = Array.from(sounds.current.values()).map((sound) =>
      sound.unloadAsync().catch(() => {}),
    );
    await Promise.all(unloadPromises);
    sounds.current.clear();
  };

  const playSound = useCallback(
    async (type: SoundType, debounceMs: number = 200) => {
      if (!isEnabled) return;
      if (!isLoaded) {
        console.log(`⚠️ Sounds not loaded yet, can't play ${type}`);
        return;
      }

      // Debounce check
      const now = Date.now();
      const last = lastPlayed.current.get(type) || 0;
      if (now - last < debounceMs) return;
      lastPlayed.current.set(type, now);

      const sound = sounds.current.get(type);
      if (!sound) return;

      try {
        // Check if sound is loaded
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) {
          console.log(`⚠️ Sound ${type} not loaded, reloading...`);
          await sound.loadAsync(SOUND_FILES[type]);
        }

        await sound.replayAsync();
      } catch (error) {
        console.log(`Error playing ${type} sound:`, error);
      }
    },
    [isEnabled, isLoaded],
  );

  // Convenience methods
  const playClick = useCallback(
    (options?: { force?: boolean }) =>
      playSound("click", options?.force ? 0 : 100),
    [playSound],
  );

  const playSwipe = useCallback(
    (options?: { force?: boolean }) =>
      playSound("swipe", options?.force ? 0 : 300),
    [playSound],
  );

  const playSuccess = useCallback(
    (options?: { force?: boolean }) =>
      playSound("success", options?.force ? 0 : 500),
    [playSound],
  );

  const playError = useCallback(
    (options?: { force?: boolean }) =>
      playSound("error", options?.force ? 0 : 500),
    [playSound],
  );

  const toggleSound = useCallback(() => {
    setIsEnabled((prev) => !prev);
  }, []);

  // Reload sounds if needed
  const reloadSounds = useCallback(async () => {
    await unloadSounds();
    await loadSounds();
  }, []);

  // Stop all sounds
  const stopAll = useCallback(async () => {
    const stopPromises = Array.from(sounds.current.values()).map((sound) =>
      sound.stopAsync().catch(() => {}),
    );
    await Promise.all(stopPromises);
  }, []);

  return {
    // Core methods
    playClick,
    playSwipe,
    playSuccess,
    playError,
    toggleSound,
    reloadSounds,
    stopAll,

    // State
    isEnabled,
    isLoaded,

    // Advanced usage
    playSound, // Direct access if needed
  };
};
