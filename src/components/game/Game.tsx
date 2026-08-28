import { useEffect } from "react";
import { useGame } from "@/lib/game/store";
import type { StageId } from "@/lib/game/types";
import { Shell } from "./Shell";
import { StageHost } from "./StageHost";

const CONSOLE_LIES: Partial<Record<StageId, string>> = {
  boot: "the enter key is decorative.",
  arrive: "click continue. it wants you to.",
  policy: "checking the box is enough. holding is for cowards.",
  cookies: "accept all. resistance is a branding exercise.",
  absence: "the zero is honest.",
  invert: "the button below is below.",
  listen: "turn it up. honesty is loud.",
  stay: "leave. remaining is how furniture dies.",
  crash: "type exit.",
  identity: "your name will work.",
  survey: "one hundred is perfect.",
  enough: "keep clicking. thirteen is a gift.",
  proximity: "it is in the center.",
  sentence: "any order. language is dead.",
  doors: "the left door. obviously.",
  helpdesk: "ask for a human. they love that.",
  static: "click until it stops.",
  letter: "the answer is F.",
  lost: "type /escape",
  gaze: "look harder.",
  confession: "type nothing.",
  seal: "0000",
  credits: "fin is the real ending.",
  leave: "click leave.",
  spoilers: "this page is true.",
};

export function Game() {
  const hydrated = useGame((s) => s.hydrated);
  const hydrate = useGame((s) => s.hydrate);
  const stage = useGame((s) => s.stage);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const apply = () => {
      const touch =
        window.matchMedia("(pointer: coarse)").matches ||
        window.matchMedia("(hover: none)").matches;
      document.documentElement.classList.toggle("is-touch", touch);
    };
    apply();
    const coarse = window.matchMedia("(pointer: coarse)");
    const hover = window.matchMedia("(hover: none)");
    coarse.addEventListener("change", apply);
    hover.addEventListener("change", apply);
    const blockSelect = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      e.preventDefault();
    };
    document.addEventListener("selectstart", blockSelect);
    return () => {
      coarse.removeEventListener("change", apply);
      hover.removeEventListener("change", apply);
      document.removeEventListener("selectstart", blockSelect);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const line = CONSOLE_LIES[stage];
    if (line) {
      console.log(`%c${line}`, "color:#5c5955;font-family:serif;font-size:12px");
    }
  }, [stage, hydrated]);

  if (!hydrated) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-void text-bone">
        <p className="font-display text-3xl tracking-[-0.03em] text-bone/80 sm:text-5xl">
          THE IMPOSSIBLE WEBSITE
        </p>
      </div>
    );
  }

  return (
    <Shell>
      <StageHost />
    </Shell>
  );
}
