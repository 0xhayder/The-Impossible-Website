export const MAIN_PATH = [
  "boot",
  "arrive",
  "policy",
  "cookies",
  "absence",
  "invert",
  "listen",
  "stay",
  "crash",
  "identity",
  "survey",
  "enough",
  "proximity",
  "sentence",
  "doors",
  "helpdesk",
  "static",
  "letter",
  "lost",
  "gaze",
  "confession",
  "seal",
  "credits",
  "leave",
] as const;

export const SIDE_ROOMS = [
  "spoilers",
  "inbox",
  "obituary",
  "admin",
  "faq",
  "other",
] as const;

export type StageId =
  | (typeof MAIN_PATH)[number]
  | (typeof SIDE_ROOMS)[number]
  | "ending";

export const ENDINGS = [
  "egress",
  "false_dawn",
  "unwritten",
  "root",
  "stasis",
  "quiet",
  "customer",
  "spoiled",
  "product",
  "obituary",
] as const;

export type EndingId = (typeof ENDINGS)[number];

export type FlagName =
  | "declinedPolicy"
  | "silentListen"
  | "xyzzy"
  | "konami"
  | "openedAbout"
  | "sawFakeExit"
  | "coldDoor"
  | "typedGoodbye"
  | "canEgress"
  | "heldPolicy"
  | "nobody"
  | "waitedStatic"
  | "thirdEye"
  | "acceptedCookies"
  | "rejectedCookies"
  | "readSpoilers"
  | "openedInbox"
  | "typedPlease"
  | "admin"
  | "confessed"
  | "surveyZero"
  | "clickedSkip"
  | "layer2"
  | "metaSolved"
  | "lookedAway"
  | "necessaryOnly"
  | "surveyLiar";

export type GameSave = {
  version: number;
  stage: StageId;
  ending: EndingId | null;
  visited: StageId[];
  flags: Partial<Record<FlagName, boolean>>;
  endings: EndingId[];
  clicks: number;
  muted: boolean;
  path: string;
  cold: number;
  remain: number;
  startedAt: number;
  lastMain: StageId;
  whisper: string;
};

export const SAVE_VERSION = 4;
export const SAVE_KEY = "impossible-website-save";

export const STAGE_TITLE: Record<StageId, string> = {
  boot: "·",
  arrive: "THE IMPOSSIBLE WEBSITE",
  policy: "before",
  cookies: "consent",
  absence: "404",
  invert: "down",
  listen: "hush",
  stay: "still",
  crash: "core.js",
  identity: "nobody",
  survey: "nps",
  enough: "13",
  proximity: "closer",
  sentence: "grammar",
  doors: "exit",
  helpdesk: "hold",
  static: " ",
  letter: "letter",
  lost: "lost",
  gaze: "look",
  confession: "sorry",
  seal: "lock",
  credits: "fin",
  leave: "leave",
  ending: "THE IMPOSSIBLE WEBSITE",
  spoilers: "spoilers",
  inbox: "inbox (1)",
  obituary: "obituary",
  admin: "admin",
  faq: "faq",
  other: "other",
};

export const STAGE_PATH: Record<StageId, string> = {
  boot: "/",
  arrive: "/arrive",
  policy: "/policy",
  cookies: "/cookies",
  absence: "/missing",
  invert: "/below",
  listen: "/signal",
  stay: "/rooms",
  crash: "/core.js",
  identity: "/who",
  survey: "/survey",
  enough: "/count",
  proximity: "/near",
  sentence: "/words",
  doors: "/exits",
  helpdesk: "/help",
  static: "/noise",
  letter: "/ask",
  lost: "/lost",
  gaze: "/see",
  confession: "/sorry",
  seal: "/lock",
  credits: "/credits",
  leave: "/end",
  ending: "/end",
  spoilers: "/spoilers",
  inbox: "/inbox",
  obituary: "/obituary",
  admin: "/admin",
  faq: "/faq",
  other: "/other",
};

export function isMain(stage: StageId): boolean {
  return (MAIN_PATH as readonly string[]).includes(stage);
}

export function isKnownStage(v: unknown): v is StageId {
  if (typeof v !== "string") return false;
  if (v === "ending") return true;
  return (
    (MAIN_PATH as readonly string[]).includes(v) ||
    (SIDE_ROOMS as readonly string[]).includes(v)
  );
}

export function defaultSave(): GameSave {
  return {
    version: SAVE_VERSION,
    stage: "boot",
    ending: null,
    visited: ["boot"],
    flags: {},
    endings: [],
    clicks: 0,
    muted: false,
    path: "/",
    cold: 0,
    remain: 0,
    startedAt: Date.now(),
    lastMain: "boot",
    whisper: "",
  };
}

export function nextStage(
  current: StageId,
  flags: Partial<Record<FlagName, boolean>> = {},
  visited: StageId[] = [],
  lastMain: StageId = "boot",
): StageId {
  switch (current) {
    case "boot":
      return "arrive";
    case "arrive":
      return "policy";
    case "policy":
      return flags.declinedPolicy ? "faq" : "cookies";
    case "faq":
      return "cookies";
    case "cookies":
      if (flags.acceptedCookies) return "inbox";
      if (flags.rejectedCookies) return "absence";
      return "invert";
    case "inbox":
      return "invert";
    case "absence":
      return "invert";
    case "invert":
      return "listen";
    case "listen":
      return "stay";
    case "stay":
      return "crash";
    case "crash":
      return "identity";
    case "identity":
      return "survey";
    case "obituary":
      return "survey";
    case "admin":
      return "survey";
    case "survey":
      if (flags.surveyLiar) return "helpdesk";
      return "enough";
    case "enough":
      return "proximity";
    case "proximity":
      return "sentence";
    case "sentence":
      return "doors";
    case "doors":
      return visited.includes("helpdesk") ? "static" : "helpdesk";
    case "helpdesk":
      if (flags.surveyLiar || visited.includes("doors")) return "static";
      return lastMain !== "helpdesk" ? lastMain : "arrive";
    case "static":
      return "letter";
    case "letter":
      return "lost";
    case "lost":
      return "gaze";
    case "gaze":
      return "confession";
    case "confession":
      return "seal";
    case "seal":
      return "credits";
    case "credits":
      return "leave";
    case "spoilers":
    case "other":
      return lastMain !== current ? lastMain : "arrive";
    case "leave":
    case "ending":
      return "leave";
    default:
      return "leave";
  }
}

export function stageIndex(stage: StageId): number {
  if (stage === "ending") return MAIN_PATH.length;
  const i = MAIN_PATH.indexOf(stage as (typeof MAIN_PATH)[number]);
  return i < 0 ? 0 : i;
}
