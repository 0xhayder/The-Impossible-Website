type AudioHandle = {
  ctx: AudioContext;
  master: GainNode;
  drone: OscillatorNode;
  drone2: OscillatorNode;
  droneGain: GainNode;
  filter: BiquadFilterNode;
};

let handle: AudioHandle | null = null;
let unlocked = false;
let wantMuted = false;

function ensure(): AudioHandle | null {
  if (typeof window === "undefined") return null;
  if (handle) return handle;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 180;
  filter.Q.value = 0.7;
  filter.connect(master);

  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.045;
  droneGain.connect(filter);

  const drone = ctx.createOscillator();
  drone.type = "sine";
  drone.frequency.value = 55;
  drone.connect(droneGain);

  const drone2 = ctx.createOscillator();
  drone2.type = "sine";
  drone2.frequency.value = 82.4;
  drone2.connect(droneGain);

  drone.start();
  drone2.start();

  handle = { ctx, master, drone, drone2, droneGain, filter };
  return handle;
}

async function resume() {
  const h = ensure();
  if (!h) return;
  if (h.ctx.state === "suspended") {
    try {
      await h.ctx.resume();
    } catch {
      /* autoplay lock */
    }
  }
}

export function unlockAudio() {
  unlocked = true;
  void resume().then(() => {
    applyMute(wantMuted);
  });
}

export function setMuted(muted: boolean) {
  wantMuted = muted;
  applyMute(muted);
}

function applyMute(muted: boolean) {
  const h = handle;
  if (!h || !unlocked) return;
  const now = h.ctx.currentTime;
  h.master.gain.cancelScheduledValues(now);
  h.master.gain.setValueAtTime(h.master.gain.value, now);
  h.master.gain.linearRampToValueAtTime(muted ? 0 : 0.22, now + 0.4);
}

export function blip(kind: "tick" | "warn" | "ok" = "tick") {
  const h = handle;
  if (!h || !unlocked || wantMuted) return;
  const now = h.ctx.currentTime;
  const o = h.ctx.createOscillator();
  const g = h.ctx.createGain();
  o.type = "triangle";
  o.frequency.value = kind === "ok" ? 420 : kind === "warn" ? 90 : 210;
  g.gain.value = 0.04;
  o.connect(g);
  g.connect(h.master);
  o.start(now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  o.stop(now + 0.14);
}

export function glitchBurst() {
  const h = handle;
  if (!h || !unlocked || wantMuted) return;
  const now = h.ctx.currentTime;
  const o = h.ctx.createOscillator();
  const g = h.ctx.createGain();
  o.type = "sawtooth";
  o.frequency.value = 70;
  o.frequency.exponentialRampToValueAtTime(28, now + 0.18);
  g.gain.value = 0.03;
  o.connect(g);
  g.connect(h.filter);
  o.start(now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  o.stop(now + 0.22);
}

export function attachUnlockListeners() {
  if (typeof window === "undefined") return () => undefined;
  const once = () => unlockAudio();
  window.addEventListener("pointerdown", once, { once: true });
  window.addEventListener("keydown", once, { once: true });
  const vis = () => {
    if (document.visibilityState === "visible") void resume();
  };
  document.addEventListener("visibilitychange", vis);
  return () => {
    window.removeEventListener("pointerdown", once);
    window.removeEventListener("keydown", once);
    document.removeEventListener("visibilitychange", vis);
  };
}
