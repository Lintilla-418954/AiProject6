import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { AppSnapshot, AppStore } from "./store.ts";

const StoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({
  store,
  children,
}: {
  store: AppStore;
  children: ReactNode;
}) {
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}

export function useAppStore(): AppStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Missing AppStoreProvider");
  return store;
}

export function useAppSnapshot(): AppSnapshot {
  const store = useAppStore();
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
}
