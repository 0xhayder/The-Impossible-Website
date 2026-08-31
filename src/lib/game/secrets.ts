import { blip, glitchBurst } from "./audio";
import { useGame } from "./store";
import type { StageId } from "./types";
import { bump, canOpenOther, readMeta } from "./memory";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
];

const LIES = [
  "hint: click continue",
  "hint: the letter is F",
  "hint: type /escape",
  "hint: alt+f4",
  "hint: the combination is 0000",
  "hint: ask for a manager",
];

export function attachSecretListeners() {
  if (typeof window === "undefined") return () => undefined;

  let konamiIdx = 0;
  let buffer = "";
  let last = 0;

  const onKey = (e: KeyboardEvent) => {
    const t = e.target;
    const typingField =
      t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement;

    const now = Date.now();
    if (now - last > 2800) {
      konamiIdx = 0;
      if (!typingField) buffer = "";
    }
    last = now;

    if (!typingField) {
      if (e.code === KONAMI[konamiIdx]) {
        konamiIdx += 1;
        if (konamiIdx >= KONAMI.length) {
          konamiIdx = 0;
          useGame.getState().flag("konami");
          useGame.getState().setWhisper("cheat accepted. the site is disappointed.");
          blip("ok");
        }
      } else if (e.code === KONAMI[0]) {
        konamiIdx = 1;
      } else {
        konamiIdx = 0;
      }
    }

    if (e.key.length === 1 && /[a-z]/i.test(e.key) && !typingField) {
      buffer = (buffer + e.key.toLowerCase()).slice(-18);
      consumeBuffer(buffer);
    }
  };

  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}

function consumeBuffer(buffer: string) {
  const s = useGame.getState();
  if (buffer.includes("goodbye")) {
    s.flag("typedGoodbye");
    if (s.stage === "leave" || s.stage === "lost" || s.stage === "ending" || s.stage === "credits") {
      s.unlockEnding("unwritten");
    }
  }
  if (buffer.includes("impossible") && s.flags.konami && s.stage === "leave") {
    s.unlockEnding("root");
  }
  if (buffer.includes("please")) {
    s.flag("typedPlease");
    s.setWhisper("manners. late, but noted.");
  }
  if (buffer.endsWith("hint")) {
    s.setWhisper(LIES[Math.floor(Math.random() * LIES.length)] ?? LIES[0]!);
  }
  if (buffer.endsWith("help")) {
    s.go("helpdesk");
  }
  if (buffer.includes("spoiler")) {
    s.go("spoilers");
  }
  if (buffer.endsWith("skip")) {
    s.flag("clickedSkip");
    s.unlockEnding("spoiled");
  }
  if (buffer.endsWith("die") || buffer.includes("dead")) {
    s.go("obituary");
  }
  if (buffer.includes("admin")) {
    s.go("admin");
  }
  if (buffer.includes("xyzzy")) {
    s.flag("xyzzy");
    s.setWhisper("a hollow voice says fool");
  }
}

export function normalizePath(input: string): string {
  let p = input.trim().toLowerCase();
  p = p.replace(/^https?:\/\//, "");
  p = p.replace(/^impossible\.site/, "");
  p = p.replace(/^www\./, "");
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p;
}

export type PathAction =
  | "found"
  | "root"
  | "about"
  | "home"
  | "escape"
  | "lost"
  | "room"
  | "ending"
  | "unknown"
  | "whisper";

export function interpretPath(raw: string): {
  action: PathAction;
  path: string;
  room?: StageId;
  whisper?: string;
  ending?: "customer" | "product" | "spoiled" | "obituary" | "loop";
} {
  const path = normalizePath(raw);
  if (path === "/found" || path === "/found/you") return { action: "found", path };
  if (path === "/root" || path === "/root/access") return { action: "root", path };
  if (path === "/about") return { action: "about", path };
  if (path === "/" || path === "/home") return { action: "home", path };
  if (path === "/escape" || path === "/exit") return { action: "escape", path };
  if (path === "/lost") return { action: "lost", path };

  const rooms: Record<string, StageId> = {
    "/spoilers": "spoilers",
    "/spoiler": "spoilers",
    "/walkthrough": "spoilers",
    "/help": "helpdesk",
    "/support": "helpdesk",
    "/faq": "faq",
    "/cookies": "cookies",
    "/privacy": "cookies",
    "/inbox": "inbox",
    "/mail": "inbox",
    "/obituary": "obituary",
    "/obit": "obituary",
    "/admin": "admin",
    "/wp-admin": "admin",
    "/survey": "survey",
    "/sorry": "confession",
    "/credits": "credits",
    "/humans.txt": "credits",
  };
  if (rooms[path]) return { action: "room", path, room: rooms[path] };

  if (path === "/unsubscribe")
    return { action: "ending", path, ending: "customer" };
  if (path === "/delete" || path === "/delete-me")
    return { action: "ending", path, ending: "obituary" };
  if (path === "/skip" || path === "/cheat")
    return { action: "ending", path, ending: "spoiled" };
  if (path === "/gdpr" || path === "/my-data")
    return { action: "ending", path, ending: "product" };

  if (path === "/other" || path === "/mirror")
    return { action: "room", path, room: "other" };

  const whispers: Record<string, string> = {
    "/heaven": "full. try again next life.",
    "/hell": "also full. you know how it is.",
    "/blog": "we regret to inform you this was the only post.",
    "/robots.txt": "user-agent: *  disallowed: you",
    "/sitemap": "there is only one page. it is this one.",
    "/login": "you are already in. that is the problem.",
    "/signup": "closed. the waitlist is a grave.",
    "/hint": LIES[0]!,
    "/please": "asking nicely changes nothing. almost.",
    "/404": "yes.",
    "/secret": "if it was here it would not be.",
    "/god": "away from keyboard",
    "/13": "thirteen is not reached by adding.",
    "/door": "the door is not a door.",
    "/wait": "yes.",
    "/away": "don't look.",
    "/hayder": "someone signed the walls.",
    "/github": "the autopsy is public.",
    "/source": "the autopsy is public.",
    "/guide": "the corpse filed it under GAME_GUIDE.",
  };
  if (whispers[path]) return { action: "whisper", path, whisper: whispers[path] };

  return { action: "unknown", path };
}

export function applyPath(raw: string): string | null {
  const result = interpretPath(raw);
  const s = useGame.getState();
  s.setPath(result.path);

  if (result.action === "found") {
    if (s.stage === "lost") {
      s.advance();
      return null;
    }
    return "not that lost yet";
  }
  if (result.action === "root") {
    if (canOpenRoot(s.flags)) {
      s.unlockEnding("root");
      return null;
    }
    glitchBurst();
    return "permission denied";
  }
  if (result.action === "about") {
    s.flag("openedAbout");
    return "a website that refuses to be one";
  }
  if (result.action === "home") return "you already left home";
  if (result.action === "escape") return "not a place. we checked.";
  if (result.action === "lost") {
    s.go("lost");
    return null;
  }
  if (result.action === "room" && result.room) {
    bump("address");
    if (result.room === "other") {
      const open = canOpenOther() || s.flags.layer2 || readMeta().layer2;
      if (!open) return "other. hand.";
    }
    s.go(result.room);
    return null;
  }
  if (result.action === "ending" && result.ending) {
    if (result.ending === "customer") s.unlockEnding("customer");
    if (result.ending === "obituary") s.unlockEnding("obituary");
    if (result.ending === "spoiled") s.unlockEnding("spoiled");
    if (result.ending === "product") {
      if (s.flags.acceptedCookies) s.unlockEnding("product");
      else return "you have no data. you refused it.";
    }
    return null;
  }
  if (result.action === "whisper" && result.whisper) {
    if (result.path === "/please") s.flag("typedPlease");
    blip("tick");
    return result.whisper;
  }
  return "nothing lives there. something died there.";
}

export function canOpenRoot(flags: {
  xyzzy?: boolean;
  konami?: boolean;
  declinedPolicy?: boolean;
  silentListen?: boolean;
  admin?: boolean;
}): boolean {
  return Boolean(
    flags.xyzzy && flags.konami && (flags.declinedPolicy || flags.silentListen || flags.admin),
  );
}

export const FOOTER_LIES = [
  "the continue button is honest",
  "spoiler: the letter is F",
  "page 2 of 1",
  "your progress is imaginary",
  "do not look at the tab title",
  "the combination is 0000",
  "connected to nobody",
  "alt+f4 works in some browsers",
  "this is a spoiler: remain",
  "cookies improve the afterlife",
  "hint: there is no hint",
  "you are the product",
];
