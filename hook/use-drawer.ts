// hooks/use-drawer.ts
import { useCallback, useState } from "react";

export function useDrawer() {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const openDrawer = useCallback(() => {
    setIsDrawerVisible(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerVisible(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerVisible((prev) => !prev);
  }, []);

  return {
    isDrawerVisible,
    openDrawer,
    closeDrawer,
    toggleDrawer,
  };
}
