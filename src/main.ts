import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/puzzle.css";
import { createRouter } from "./app/router.ts";
import { createStore } from "./app/store.ts";

const root = document.getElementById("app");
if (!root) throw new Error("Missing #app root");

const store = createStore();
createRouter(root, store);

if (!store.repository.persistent) {
  const warning = document.createElement("div");
  warning.className = "storage-warning";
  warning.textContent =
    "Local storage is unavailable. Progress will last only for this tab.";
  warning.setAttribute("role", "status");
  document.body.append(warning);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) store.audio.suspend();
  else store.audio.resume();
});

window.addEventListener("storage", () => {
  store.save = store.repository.load();
});
