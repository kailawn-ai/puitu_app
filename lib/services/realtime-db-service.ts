import database, {
  FirebaseDatabaseTypes,
} from "@react-native-firebase/database";

class RealtimeDBServiceClass {
  private getRef(path: string): FirebaseDatabaseTypes.Reference {
    return database().ref(path);
  }

  async set(path: string, value: unknown): Promise<void> {
    await this.getRef(path).set(value);
  }

  async update(path: string, value: Record<string, unknown>): Promise<void> {
    await this.getRef(path).update(value);
  }

  async get<T = unknown>(path: string): Promise<T | null> {
    const snapshot = await this.getRef(path).once("value");
    return (snapshot.val() as T) ?? null;
  }

  async push<T = Record<string, unknown>>(
    path: string,
    value: T,
  ): Promise<string | null> {
    const ref = this.getRef(path).push();
    await ref.set(value);
    return ref.key;
  }

  async remove(path: string): Promise<void> {
    await this.getRef(path).remove();
  }

  subscribe<T = unknown>(
    path: string,
    onData: (value: T | null) => void,
    onError?: (error: Error) => void,
  ): () => void {
    const ref = this.getRef(path);

    const callback = ref.on(
      "value",
      (snapshot) => {
        onData((snapshot.val() as T) ?? null);
      },
      (error) => {
        onError?.(error as Error);
      },
    );

    return () => ref.off("value", callback);
  }

  serverTimestamp() {
    return database.ServerValue.TIMESTAMP;
  }
}

export const RealtimeDBService = new RealtimeDBServiceClass();
