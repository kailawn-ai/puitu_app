// hooks/use-navigation.ts
import { usePathname, useRouter } from "expo-router";

export function useNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (route: string) => {
    router.push(route as any);
  };

  const getActiveTab = () => {
    const routes = [
      { id: "home", path: "/home" },
      { id: "courses", path: "/courses" },
      { id: "shorts", path: "/shorts" },
      { id: "subscription", path: "/subscription" },
      { id: "profile", path: "/profile" },
    ];

    return routes.find((route) => pathname.includes(route.path))?.id || "home";
  };

  return {
    navigate,
    getActiveTab,
    currentPath: pathname,
  };
}
