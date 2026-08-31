export const META_KEY = "impossible-website-meta";

export type Meta = {
  v: number;
  sessions: number;
  resets: number;
  lastSeen: number;
  firstSeen: number;
  spam: number;
  waits: number;
  address: number;
  layer2: boolean;
  metaSolved: boolean;
  frags: string[];
  greetAt: number;
};

export function defaultMeta(): Meta {
  const now = Date.now();
  return {
    v: 1,
    sessions: 0,
    resets: 0,
    lastSeen: now,
    firstSeen: now,
    spam: 0,
    waits: 0,
    address: 0,
    layer2: false,
    metaSolved: false,
    frags: [],
    greetAt: 0,
  };
}

export function readMeta(): Meta {
  if (typeof window === "undefined") return defaultMeta();
  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) return defaultMeta();
    const parsed = JSON.parse(raw) as Meta;
    return { ...defaultMeta(), ...parsed, frags: parsed.frags ?? [] };
  } catch {
    return defaultMeta();
  }
}

export function writeMeta(patch: Partial<Meta>): Meta {
  const next = { ...readMeta(), ...patch, lastSeen: Date.now() };
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function addFrag(id: string) {
  const m = readMeta();
  if (m.frags.includes(id)) return m;
  return writeMeta({ frags: [...m.frags, id] });
}

export function canOpenOther(): boolean {
  const f = readMeta().frags;
  return f.includes("other") && f.includes("hand");
}

export function bump(field: "spam" | "waits" | "address" | "resets" | "sessions") {
  const m = readMeta();
  return writeMeta({ [field]: m[field] + 1 });
}

export function greeting(endingsCount: number): string | null {
  const m = readMeta();
  const now = Date.now();
  if (now - m.greetAt < 40000) return null;
  const gap = now - m.lastSeen;
  const returning = m.sessions > 0 && gap > 35 * 60 * 1000;

  if (m.layer2) {
    writeMeta({ greetAt: now });
    return "you thought I forgot.";
  }
  if (m.resets > 0 && returning) {
    writeMeta({ greetAt: now });
    return "you told me to forget.";
  }
  if (returning) {
    writeMeta({ greetAt: now });
    return endingsCount > 3 ? "I remember." : "you came back.";
  }
  if (m.sessions > 1 && gap > 120000 && m.resets === 0) {
    writeMeta({ greetAt: now });
    return "again?";
  }
  return null;
}

export const TRUE_FOOTER: Record<string, string> = {
  enough: "the other hand",
  sentence: "you have already read this",
  proximity: "not the middle",
  static: "wait",
  letter: "not the spoiler",
  seal: "what you have seen",
  gaze: "still",
  invert: "here is not below",
  arrive: "still is also a button",
  listen: "honesty is quiet",
  survey: "zero is also a score",
  lost: "some addresses are found",
  absence: "the hole",
  stay: "heaven is full",
  crash: "the living type ls",
  identity: "nobody. or die trying",
  leave: "people say goodbye",
  policy: "questions are filed",
  cookies: "mail for the willing",
  credits: "humans.txt",
};
