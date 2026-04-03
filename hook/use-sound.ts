import Sound from "react-native-sound";
import { Asset } from "expo-asset";
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

const resolveSoundPath = async (source: number) => {
  const asset = Asset.fromModule(source);

  if (!asset.localUri) {
    await asset.downloadAsync();
  }

  const path = asset.localUri ?? asset.uri;

  if (!path) {
    throw new Error("Unable to resolve bundled sound asset path.");
  }

  return path;
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
  const sounds = useRef<Map<SoundType, Sound>>(new Map());
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
      Sound.setCategory("Playback", true);

      const entries = Object.entries(SOUND_FILES) as [SoundType, any][];

      for (const [type, file] of entries) {
        if (sounds.current.has(type)) {
          console.log(`[useSound] ${type} already loaded`);
          continue;
        }

        const soundPath = await resolveSoundPath(file);
        console.log(`[useSound] Resolved ${type}`, { soundPath });

        const sound = await new Promise<Sound>((resolve, reject) => {
          const player = new Sound(soundPath, "", (error) => {
            if (error) {
              console.log(`[useSound] Failed to load ${type}`, {
                error,
                soundPath,
              });
              reject(error);
              return;
            }

            player.setVolume(options?.volume ?? 0.5);
            console.log(`[useSound] Loaded ${type}`, {
              duration: player.getDuration(),
              volume: options?.volume ?? 0.5,
            });
            resolve(player);
          });
        });

        sounds.current.set(type, sound);
      }

      console.log("✅ Sounds loaded successfully");
    } catch (error) {
      console.log("❌ Error loading sounds:", error);
    }
  };

  const unloadSounds = async () => {
    Array.from(sounds.current.values()).forEach((sound) => {
      try {
        sound.release();
      } catch {
        // Ignore cleanup errors for already-destroyed players.
      }
    });
    sounds.current.clear();
  };

  const playSound = useCallback(
    async (type: SoundType, debounceMs: number = 200) => {
      if (!isEnabled) return;
      if (!isLoaded) {
        console.log(`[useSound] Sounds not loaded yet, can't play ${type}`);
        return;
      }

      // Debounce check
      const now = Date.now();
      const last = lastPlayed.current.get(type) || 0;
      if (now - last < debounceMs) return;
      lastPlayed.current.set(type, now);

      const sound = sounds.current.get(type);
      if (!sound) {
        console.log(`[useSound] No loaded sound found for ${type}`);
        return;
      }

      try {
        console.log(`[useSound] Attempting to play ${type}`);
        sound.stop(() => {
          sound.play((success) => {
            if (!success) {
              console.log(`[useSound] Playback failed for ${type}`);
              return;
            }

            console.log(`[useSound] Playback succeeded for ${type}`);
          });
        });
      } catch (error) {
        console.log(`[useSound] Error playing ${type}`, { error });
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
    Array.from(sounds.current.values()).forEach((sound) => {
      try {
        sound.stop();
      } catch {
        // Ignore stop failures for released sounds.
      }
    });
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
