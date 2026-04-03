import Sound from "react-native-sound";
import { Asset } from "expo-asset";

export type SoundType = "click" | "swipe" | "success" | "error";

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

class SoundService {
  private sounds: Map<SoundType, Sound> = new Map();
  private isEnabled: boolean = true;
  private lastPlayed: Map<SoundType, number> = new Map();
  private readonly debounceTime: number = 300; // ms
  private loadPromise: Promise<void> | null = null;

  constructor() {
    Sound.setCategory("Playback", true);
    void this.loadSounds();
  }

  private async loadSounds() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadSoundsInternal();
    try {
      await this.loadPromise;
    } finally {
      this.loadPromise = null;
    }
  }

  private async loadSoundsInternal() {
    try {
      const soundConfigs: Record<SoundType, any> = {
        click: require("../../assets/sounds/click.mp3"),
        swipe: require("../../assets/sounds/swipe.mp3"),
        success: require("../../assets/sounds/success.mp3"),
        error: require("../../assets/sounds/error.mp3"),
      };

      for (const [type, source] of Object.entries(soundConfigs)) {
        const soundType = type as SoundType;

        if (this.sounds.has(soundType)) {
          console.log(`[SoundService] ${soundType} already loaded`);
          continue;
        }

        const soundPath = await resolveSoundPath(source);
        console.log(`[SoundService] Resolved ${soundType}`, {
          soundPath,
        });

        const sound = await new Promise<Sound>((resolve, reject) => {
          const player = new Sound(soundPath, "", (error) => {
            if (error) {
              console.log(`[SoundService] Failed to load ${soundType}`, {
                error,
                soundPath,
              });
              reject(error);
              return;
            }

            player.setVolume(soundType === "swipe" ? 0.3 : 0.5);
            console.log(`[SoundService] Loaded ${soundType}`, {
              duration: player.getDuration(),
              volume: soundType === "swipe" ? 0.3 : 0.5,
            });
            resolve(player);
          });
        });

        this.sounds.set(soundType, sound);
      }
    } catch (error) {
      console.log("Error loading sounds:", error);
    }
  }

  /**
   * Play a sound with optional debounce
   */
  async play(type: SoundType, debounce: boolean = false): Promise<void> {
    if (!this.isEnabled) return;
    await this.loadSounds();

    const sound = this.sounds.get(type);
    if (!sound) {
      console.log(`[SoundService] No loaded sound found for ${type}`);
      return;
    }

    // Debounce check for swipe sounds
    if (debounce) {
      const now = Date.now();
      const last = this.lastPlayed.get(type) || 0;
      if (now - last < this.debounceTime) return;
      this.lastPlayed.set(type, now);
    }

    try {
      console.log(`[SoundService] Attempting to play ${type}`);
      sound.stop(() => {
        sound.play((success) => {
          if (!success) {
            console.log(`[SoundService] Playback failed for ${type}`);
            return;
          }

          console.log(`[SoundService] Playback succeeded for ${type}`);
        });
      });
    } catch (error) {
      console.log(`[SoundService] Error playing ${type}`, { error });
    }
  }

  /**
   * Preload all sounds
   */
  async preloadAll(): Promise<void> {
    await this.loadSounds();
  }

  /**
   * Enable/disable sounds
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if sounds are enabled
   */
  get isSoundEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Toggle sound on/off
   */
  toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  /**
   * Clean up sounds (call this when app unmounts)
   */
  async cleanup(): Promise<void> {
    Array.from(this.sounds.values()).forEach((sound) => {
      try {
        sound.release();
      } catch {
        // Ignore cleanup errors for already-destroyed players.
      }
    });
    this.sounds.clear();
  }

  /**
   * Play click sound (convenience method)
   */
  click(): void {
    this.play("click");
  }

  /**
   * Play swipe sound (with debounce)
   */
  swipe(): void {
    this.play("swipe", true);
  }

  /**
   * Play success sound
   */
  success(): void {
    this.play("success");
  }

  /**
   * Play error sound
   */
  error(): void {
    this.play("error");
  }
}

// Create and export a singleton instance
export const soundService = new SoundService();
