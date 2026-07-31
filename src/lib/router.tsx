import {
  createContext,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

type RouterValue = Readonly<{
  navigate: (to: string, options?: { replace?: boolean }) => void;
  pathname: string;
  search: string;
}>;

const RouterContext = createContext<RouterValue | null>(null);

export function RouterProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [location, setLocation] = useState(() => ({
    pathname: window.location.pathname,
    search: window.location.search
  }));
  const syncLocation = useCallback(() => {
    setLocation({
      pathname: window.location.pathname,
      search: window.location.search
    });
  }, []);
  useEffect(() => {
    window.addEventListener("popstate", syncLocation);
    return () => window.removeEventListener("popstate", syncLocation);
  }, [syncLocation]);

  const navigate = useCallback(
    (to: string, options?: { replace?: boolean }) => {
      const target = new URL(to, window.location.origin);
      if (target.origin !== window.location.origin) {
        throw new Error("Client navigation must stay on the application origin.");
      }
      window.history[options?.replace ? "replaceState" : "pushState"](
        null,
        "",
        `${target.pathname}${target.search}${target.hash}`
      );
      syncLocation();
    },
    [syncLocation]
  );
  const value = useMemo(
    () => ({ ...location, navigate }),
    [location, navigate]
  );
  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
}

export function useRouter(): RouterValue {
  const value = useContext(RouterContext);
  if (!value) throw new Error("useRouter must be used inside RouterProvider");
  return value;
}

export function Link({
  children,
  className,
  to
}: Readonly<{ children: ReactNode; className?: string; to: string }>) {
  const { navigate } = useRouter();
  return (
    <a
      className={className}
      href={to}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}
