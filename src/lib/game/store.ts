import { create } from "zustand";
import { clearSave, readSave, writeSave } from "./save";
import {
  defaultSave,
  isMain,
  nextStage,
  STAGE_PATH,
  type EndingId,
  type FlagName,
  type GameSave,
  type StageId,
} from "./types";
import { bump, greeting, readMeta, writeMeta } from "./memory";
import { blip, glitchBurst, setMuted as setAudioMuted } from "./audio";

type GameStore = GameSave & {
  hydrated: boolean;
  forgetOpen: boolean;
  hydrate: () => void;
  persistNow: () => void;
  go: (stage: StageId) => void;
  advance: () => void;
  back: () => void;
  flag: (name: FlagName, value?: boolean) => void;
  unlockEnding: (id: EndingId) => void;
  returnFromEnding: () => void;
  reset: () => void;
  setMuted: (muted: boolean) => void;
  setPath: (path: string) => void;
  bumpClicks: () => void;
  setCold: (n: number) => void;
  setRemain: (n: number) => void;
  setForgetOpen: (open: boolean) => void;
  setWhisper: (whisper: string) => void;
};

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(state: GameSave) {
  if (typeof window === "undefined") return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => writeSave(state), 180);
}

function asSave(s: GameStore): GameSave {
  return {
    version: s.version,
    stage: s.stage,
    ending: s.ending,
    visited: s.visited,
    flags: s.flags,
    endings: s.endings,
    clicks: s.clicks,
    muted: s.muted,
    path: s.path,
    cold: s.cold,
    remain: s.remain,
    startedAt: s.startedAt,
    lastMain: s.lastMain,
    whisper: s.whisper,
  };
}

export const useGame = create<GameStore>((set, get) => ({
  ...defaultSave(),
  hydrated: false,
  forgetOpen: false,

  hydrate: () => {
    const loaded = readSave();
    if (loaded.stage === "leave") {
      loaded.flags = { ...loaded.flags, canEgress: true };
    }
    const meta = bump("sessions");
    if (meta.layer2) loaded.flags = { ...loaded.flags, layer2: true };
    if (meta.metaSolved) loaded.flags = { ...loaded.flags, metaSolved: true };
    const line = greeting(loaded.endings.length);
    set({
      ...loaded,
      hydrated: true,
      forgetOpen: false,
      whisper: line ?? loaded.whisper ?? "",
    });
    setAudioMuted(loaded.muted);
    writeMeta({ lastSeen: Date.now() });
  },

  persistNow: () => {
    writeSave(asSave(get()));
  },

  go: (stage) => {
    const visited = get().visited.includes(stage)
      ? get().visited
      : [...get().visited, stage];
    const path = STAGE_PATH[stage] ?? get().path;
    const flags =
      stage === "leave" ? { ...get().flags, canEgress: true } : get().flags;
    set({
      stage,
      visited,
      path,
      flags,
      lastMain: isMain(stage) ? stage : get().lastMain,
      ending: stage === "ending" ? get().ending : null,
      whisper: "",
    });
    schedulePersist(asSave(get()));
  },

  advance: () => {
    const n = nextStage(get().stage);
    blip("ok");
    get().go(n);
  },

  back: () => {
    const target = get().lastMain || "arrive";
    get().go(target === get().stage ? "arrive" : target);
  },

  flag: (name, value = true) => {
    set({ flags: { ...get().flags, [name]: value } });
    schedulePersist(asSave(get()));
  },

  unlockEnding: (id) => {
    const endings = get().endings.includes(id)
      ? get().endings
      : [...get().endings, id];
    glitchBurst();
    const layer2 = endings.length >= 10;
    if (layer2) writeMeta({ layer2: true });
    set({
      stage: "ending",
      ending: id,
      endings,
      path: `/end/${id}`,
      flags: layer2 ? { ...get().flags, layer2: true } : get().flags,
      visited: get().visited.includes("ending")
        ? get().visited
        : [...get().visited, "ending"],
    });
    schedulePersist(asSave(get()));
  },

  returnFromEnding: () => {
    const last =
      [...get().visited].reverse().find((s) => isMain(s)) ?? "leave";
    set({ stage: last, ending: null, path: STAGE_PATH[last] });
    schedulePersist(asSave(get()));
  },

  reset: () => {
    bump("resets");
    const layer2 = readMeta().layer2;
    clearSave();
    const fresh = defaultSave();
    if (layer2) fresh.flags.layer2 = true;
    set({
      ...fresh,
      hydrated: true,
      forgetOpen: false,
      whisper: "you asked me to forget.",
    });
    setAudioMuted(false);
    writeSave(fresh);
  },

  setMuted: (muted) => {
    set({ muted });
    setAudioMuted(muted);
    schedulePersist(asSave(get()));
  },

  setPath: (path) => {
    set({ path });
    schedulePersist(asSave(get()));
  },

  bumpClicks: () => {
    set({ clicks: get().clicks + 1 });
    schedulePersist(asSave(get()));
  },

  setCold: (n) => {
    set({ cold: n });
    schedulePersist(asSave(get()));
  },

  setRemain: (n) => {
    set({ remain: n });
    schedulePersist(asSave(get()));
  },

  setForgetOpen: (open) => set({ forgetOpen: open }),

  setWhisper: (whisper) => {
    set({ whisper });
    schedulePersist(asSave(get()));
  },
}));

if (typeof window !== "undefined") {
  const w = window as Window & {
    __impossible?: {
      go: (stage: StageId) => void;
      ending: (id: EndingId) => void;
      reset: () => void;
    };
  };
  w.__impossible = {
    go: (stage) => useGame.getState().go(stage),
    ending: (id) => useGame.getState().unlockEnding(id),
    reset: () => useGame.getState().reset(),
  };
}
