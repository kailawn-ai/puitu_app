// contexts/drawer-context.tsx
import React, { createContext, useContext, useState } from "react";

interface DrawerContextType {
  isVisible: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  const openDrawer = () => setIsVisible(true);
  const closeDrawer = () => setIsVisible(false);
  const toggleDrawer = () => setIsVisible((prev) => !prev);

  return (
    <DrawerContext.Provider
      value={{ isVisible, openDrawer, closeDrawer, toggleDrawer }}
    >
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const context = useContext(DrawerContext);
  if (context === undefined) {
    throw new Error("useDrawer must be used within a DrawerProvider");
  }
  return context;
}
