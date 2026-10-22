import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import "./styles/index.css";
import { router } from "./app/router.tsx";
import { AppStoreProvider } from "./app/store-context.tsx";
import { createStore } from "./app/store.ts";

const rootElement = document.getElementById("app");
if (!rootElement) throw new Error("Missing #app root");

const store = createStore();

function App() {
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) store.audio.suspend();
      else store.audio.resume();
    };
    const handleStorage = () => store.reloadFromRepository();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("storage", handleStorage);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <AppStoreProvider store={store}>
      <RouterProvider router={router} />
      {!store.repository.persistent ? (
        <div className="storage-warning" role="status">
          Local storage is unavailable. Progress will last only for this tab.
        </div>
      ) : null}
    </AppStoreProvider>
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
