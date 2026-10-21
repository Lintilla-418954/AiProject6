import type { AppStore } from "../../app/store.ts";
import type { Settings } from "../../game/persistence.ts";
import { button, el, replace, routeLink } from "../dom.ts";

export function renderSettings(root: HTMLElement, store: AppStore): void {
  const page = el("main", "settings-screen");
  page.append(
    routeLink("← Station", "/", "back-link"),
    el("p", "eyebrow", "LOCAL SYSTEMS"),
    el("h1", "screen-title", "Settings"),
  );
  const form = el("div", "settings-panel");
  const update = (patch: Partial<Settings>) => {
    store.updateSave({
      ...store.save,
      settings: { ...store.save.settings, ...patch },
    });
    renderSettings(root, store);
  };
  form.append(
    toggle(
      "Sound effects",
      "Mechanical and feedback cues",
      store.save.settings.soundEnabled,
      (value) => update({ soundEnabled: value }),
    ),
    range("Sound volume", store.save.settings.soundVolume, (value) =>
      update({ soundVolume: value }),
    ),
    toggle(
      "Ambient music",
      "Low procedural Chapter ambience",
      store.save.settings.musicEnabled,
      (value) => update({ musicEnabled: value }),
    ),
    range("Music volume", store.save.settings.musicVolume, (value) =>
      update({ musicVolume: value }),
    ),
  );
  const motion = el("label", "setting-row");
  motion.append(el("span", "setting-name", "Reduced motion"));
  const select = el("select");
  for (const [value, label] of [
    ["system", "Follow system"],
    ["true", "On"],
    ["false", "Off"],
  ]) {
    const option = el("option", undefined, label);
    option.value = value;
    option.selected = String(store.save.settings.reducedMotion) === value;
    select.append(option);
  }
  select.addEventListener("change", () =>
    update({
      reducedMotion:
        select.value === "system" ? "system" : select.value === "true",
    }),
  );
  motion.append(select);
  form.append(motion);
  const reset = button(
    "Reset all progress",
    () => {
      if (window.confirm("Erase every Puzzle result and local setting?")) {
        store.save = store.repository.clear();
        store.audio.update(store.save.settings);
        renderSettings(root, store);
      }
    },
    "danger-action",
  );
  page.append(form, reset);
  replace(root, page);
}

function toggle(
  name: string,
  description: string,
  checked: boolean,
  onChange: (value: boolean) => void,
): HTMLElement {
  const label = el("label", "setting-row");
  const copy = el("span");
  copy.append(
    el("span", "setting-name", name),
    el("small", "setting-description", description),
  );
  const input = el("input");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", () => onChange(input.checked));
  label.append(copy, input);
  return label;
}

function range(
  name: string,
  value: number,
  onChange: (value: number) => void,
): HTMLElement {
  const label = el("label", "setting-row");
  label.append(el("span", "setting-name", name));
  const input = el("input");
  input.type = "range";
  input.min = "0";
  input.max = "1";
  input.step = "0.05";
  input.value = String(value);
  input.addEventListener("change", () => onChange(Number(input.value)));
  label.append(input);
  return label;
}
