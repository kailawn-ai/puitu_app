// store/drawer-store.ts
import { create } from "zustand";

interface DrawerStore {
  isVisible: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export const useDrawerStore = create<DrawerStore>((set) => ({
  isVisible: false,
  openDrawer: () => set({ isVisible: true }),
  closeDrawer: () => set({ isVisible: false }),
  toggleDrawer: () => set((state) => ({ isVisible: !state.isVisible })),
}));
