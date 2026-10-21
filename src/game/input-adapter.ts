import type { KeyToken } from "../engine/keys.ts";

const BLOCKED = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Insert",
  "Delete",
]);
const RESERVED_CONTROL = new Set(["w", "n", "t"]);
const MODIFIERS = new Set([
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "NumLock",
]);

export type InputResult =
  | { kind: "token"; token: KeyToken }
  | { kind: "blocked"; label: string }
  | { kind: "reset" }
  | { kind: "hint" }
  | { kind: "ignored" };

export function mapKeyboardEvent(event: KeyboardEvent): InputResult {
  if (event.isComposing || event.keyCode === 229) return { kind: "ignored" };
  if (event.metaKey) return { kind: "ignored" };
  if (event.key === "F2") return { kind: "reset" };
  if (event.key === "F1") return { kind: "hint" };
  if (BLOCKED.has(event.key)) return { kind: "blocked", label: event.key };
  if (MODIFIERS.has(event.key)) return { kind: "ignored" };
  if (event.ctrlKey) {
    const key = event.key.toLowerCase();
    if (RESERVED_CONTROL.has(key))
      return { kind: "blocked", label: `Ctrl-${event.key.toUpperCase()}` };
    if (key === "[") return { kind: "token", token: "<Esc>" };
    if (key.length === 1) return { kind: "token", token: `<C-${key}>` };
    return { kind: "ignored" };
  }
  const specials: Record<string, KeyToken> = {
    Escape: "<Esc>",
    Enter: "<CR>",
    Backspace: "<BS>",
    Tab: "<Tab>",
  };
  if (specials[event.key]) return { kind: "token", token: specials[event.key] };
  if (event.key.length === 1) return { kind: "token", token: event.key };
  return { kind: "ignored" };
}

export function bindInput(options: {
  onInput: (input: InputResult) => void;
  capture: HTMLTextAreaElement;
}): () => void {
  const keydown = (event: KeyboardEvent) => {
    const input = mapKeyboardEvent(event);
    if (input.kind === "ignored") return;
    event.preventDefault();
    options.onInput(input);
  };
  const beforeInput = (event: InputEvent) => {
    if (event.isComposing || !event.data) return;
    event.preventDefault();
    for (const token of event.data) options.onInput({ kind: "token", token });
    options.capture.value = "";
  };
  window.addEventListener("keydown", keydown);
  options.capture.addEventListener("beforeinput", beforeInput);
  return () => {
    window.removeEventListener("keydown", keydown);
    options.capture.removeEventListener("beforeinput", beforeInput);
  };
}
