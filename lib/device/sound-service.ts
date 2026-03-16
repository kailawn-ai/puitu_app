import { Audio } from "expo-av";

export type SoundType = "click" | "swipe" | "success" | "error";

class SoundService {
  private sounds: Map<SoundType, Audio.Sound> = new Map();
  private isEnabled: boolean = true;
  private lastPlayed: Map<SoundType, number> = new Map();
  private readonly debounceTime: number = 300; // ms

  constructor() {
    this.loadSounds();
  }

  private async loadSounds() {
    try {
      // Load all sound files
      const soundConfigs: Record<SoundType, any> = {
        click: require("../../assets/sounds/click.mp3"),
        swipe: require("../../assets/sounds/swipe.mp3"),
        success: require("../../assets/sounds/success.mp3"),
        error: require("../../assets/sounds/error.mp3"),
      };

      for (const [type, source] of Object.entries(soundConfigs)) {
        const { sound } = await Audio.Sound.createAsync(source, {
          shouldPlay: false,
          volume: type === "swipe" ? 0.3 : 0.5, // Lower volume for swipe
        });
        this.sounds.set(type as SoundType, sound);
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

    const sound = this.sounds.get(type);
    if (!sound) return;

    // Debounce check for swipe sounds
    if (debounce) {
      const now = Date.now();
      const last = this.lastPlayed.get(type) || 0;
      if (now - last < this.debounceTime) return;
      this.lastPlayed.set(type, now);
    }

    try {
      await sound.replayAsync();
    } catch (error) {
      console.log(`Error playing ${type} sound:`, error);
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
    const unloadPromises = Array.from(this.sounds.values()).map((sound) =>
      sound.unloadAsync().catch(() => {}),
    );
    await Promise.all(unloadPromises);
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
