import { Link } from "@tanstack/react-router";
import { useAppSnapshot, useAppStore } from "../../app/store-context.tsx";
import type { Settings } from "../../game/persistence.ts";

export function SettingsScreen() {
  const store = useAppStore();
  const { save } = useAppSnapshot();
  const update = (patch: Partial<Settings>) => {
    store.updateSave({
      ...save,
      settings: { ...save.settings, ...patch },
    });
  };

  return (
    <main className="settings-screen">
      <Link to="/" className="back-link">
        ← Station
      </Link>
      <p className="eyebrow">LOCAL SYSTEMS</p>
      <h1 className="screen-title">Settings</h1>
      <div className="settings-panel">
        <Toggle
          name="Sound effects"
          description="Mechanical and feedback cues"
          checked={save.settings.soundEnabled}
          onChange={(soundEnabled) => update({ soundEnabled })}
        />
        <Range
          name="Sound volume"
          value={save.settings.soundVolume}
          onChange={(soundVolume) => update({ soundVolume })}
        />
        <Toggle
          name="Ambient music"
          description="Low procedural Chapter ambience"
          checked={save.settings.musicEnabled}
          onChange={(musicEnabled) => update({ musicEnabled })}
        />
        <Range
          name="Music volume"
          value={save.settings.musicVolume}
          onChange={(musicVolume) => update({ musicVolume })}
        />
        <label className="setting-row">
          <span className="setting-name">Reduced motion</span>
          <select
            value={String(save.settings.reducedMotion)}
            onChange={(event) =>
              update({
                reducedMotion:
                  event.target.value === "system"
                    ? "system"
                    : event.target.value === "true",
              })
            }
          >
            <option value="system">Follow system</option>
            <option value="true">On</option>
            <option value="false">Off</option>
          </select>
        </label>
      </div>
      <button
        type="button"
        className="danger-action"
        onClick={() => {
          if (window.confirm("Erase every Puzzle result and local setting?")) {
            store.reset();
          }
        }}
      >
        Reset all progress
      </button>
    </main>
  );
}

function Toggle({
  name,
  description,
  checked,
  onChange,
}: {
  name: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="setting-row">
      <span>
        <span className="setting-name">{name}</span>
        <small className="setting-description">{description}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function Range({
  name,
  value,
  onChange,
}: {
  name: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="setting-row">
      <span className="setting-name">{name}</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
