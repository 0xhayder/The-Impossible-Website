import {
  SAVE_KEY,
  SAVE_VERSION,
  defaultSave,
  isKnownStage,
  type GameSave,
} from "./types";
import { ENDINGS } from "./types";

function migrate(raw: GameSave): GameSave {
  const base = defaultSave();
  const merged: GameSave = {
    ...base,
    ...raw,
    flags: { ...base.flags, ...raw.flags },
    endings: Array.isArray(raw.endings)
      ? raw.endings.filter((e): e is GameSave["endings"][number] =>
          (ENDINGS as readonly string[]).includes(e),
        )
      : [],
    visited: Array.isArray(raw.visited)
      ? raw.visited.filter(isKnownStage)
      : base.visited,
    lastMain: isKnownStage(raw.lastMain) ? raw.lastMain : "boot",
    whisper: typeof raw.whisper === "string" ? raw.whisper : "",
  };
  if (!isKnownStage(merged.stage)) merged.stage = "boot";
  merged.version = SAVE_VERSION;
  return merged;
}

export function readSave(): GameSave {
  if (typeof window === "undefined") return defaultSave();
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as GameSave;
    if (!parsed || typeof parsed !== "object") return defaultSave();
    return migrate(parsed);
  } catch {
    return defaultSave();
  }
}

export function writeSave(save: GameSave) {
  if (typeof window === "undefined") return;
  try {
    const prev = window.localStorage.getItem(SAVE_KEY);
    if (prev) window.localStorage.setItem(`${SAVE_KEY}.bak`, prev);
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* ignore */
  }
}

export function clearSave() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SAVE_KEY);
    window.localStorage.removeItem(`${SAVE_KEY}.bak`);
  } catch {
    /* ignore */
  }
}
