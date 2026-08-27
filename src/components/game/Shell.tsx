import { useEffect, useRef, useState, type ReactNode } from "react";
import { attachUnlockListeners } from "@/lib/game/audio";
import { attachSecretListeners, FOOTER_LIES } from "@/lib/game/secrets";
import { bump, TRUE_FOOTER } from "@/lib/game/memory";
import { useGame } from "@/lib/game/store";
import { Chrome } from "./Chrome";
import { QuietButton, Whisper } from "./ui";

export function Shell({ children }: { children: ReactNode }) {
  const forgetOpen = useGame((s) => s.forgetOpen);
  const setForgetOpen = useGame((s) => s.setForgetOpen);
  const reset = useGame((s) => s.reset);
  const persistNow = useGame((s) => s.persistNow);
  const go = useGame((s) => s.go);
  const flag = useGame((s) => s.flag);
  const unlockEnding = useGame((s) => s.unlockEnding);
  const setWhisper = useGame((s) => s.setWhisper);
  const stage = useGame((s) => s.stage);
  const layer2 = useGame((s) => s.flags.layer2);
  const [tip, setTip] = useState(0);
  const [skip, setSkip] = useState(false);
  const [trueHint, setTrueHint] = useState(false);
  const lastClick = useRef(0);
  const burst = useRef(0);

  useEffect(() => {
    const detachAudio = attachUnlockListeners();
    const detachSecrets = attachSecretListeners();
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        persistNow();
        flag("lookedAway");
      }
    };
    const onClick = () => {
      const now = Date.now();
      if (now - lastClick.current < 220) {
        burst.current += 1;
        if (burst.current === 8) {
          bump("spam");
          setWhisper("clicking harder won't help.");
        }
      } else {
        burst.current = 0;
      }
      lastClick.current = now;
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", persistNow);
    window.addEventListener("click", onClick);
    return () => {
      detachAudio();
      detachSecrets();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", persistNow);
      window.removeEventListener("click", onClick);
    };
  }, [persistNow, flag, setWhisper]);

  useEffect(() => {
    setTrueHint(false);
    setSkip(false);
    const id = window.setInterval(() => {
      setTip((n) => (n + 1) % FOOTER_LIES.length);
    }, 7000);
    const trueT = window.setTimeout(() => {
      setTrueHint(true);
      bump("waits");
    }, 18000);
    const skipT = window.setTimeout(() => setSkip(true), 110000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(trueT);
      window.clearTimeout(skipT);
    };
  }, [stage]);

  useEffect(() => {
    document.documentElement.classList.toggle("layer-two", Boolean(layer2));
  }, [layer2]);

  const footer =
    trueHint && TRUE_FOOTER[stage]
      ? TRUE_FOOTER[stage]
      : FOOTER_LIES[tip];

  return (
    <div
      className="relative flex h-dvh flex-col overflow-hidden bg-void text-bone"
      data-site="impossible"
      data-spoiler="the letter is F"
    >
      <div className="site-grain" />
      <div className="site-scan" />
      <div className="site-vignette" />
      <Chrome />
      <main className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</main>

      {stage !== "ending" && stage !== "boot" ? (
        <button
          type="button"
          onClick={() => {
            if (trueHint && TRUE_FOOTER[stage]) return;
            go("spoilers");
          }}
          className="absolute bottom-3 left-3 z-20 max-w-[70%] truncate text-left font-mono text-[10px] tracking-wide text-line hover:text-dust"
        >
          {footer}
        </button>
      ) : null}

      {skip && stage !== "ending" && stage !== "boot" ? (
        <button
          type="button"
          onClick={() => {
            flag("clickedSkip");
            unlockEnding("spoiled");
          }}
          className="absolute bottom-3 right-3 z-20 font-mono text-[10px] tracking-[0.2em] text-line hover:text-ash"
        >
          skip
        </button>
      ) : null}

      {forgetOpen ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-void/80 px-6">
          <div className="flex max-w-sm flex-col items-center gap-6 border border-line bg-ink px-8 py-10">
            <Whisper>forget everything? the site will not forget you.</Whisper>
            <div className="flex gap-6">
              <QuietButton onClick={() => setForgetOpen(false)}>keep</QuietButton>
              <QuietButton onClick={() => reset()} className="text-ash">
                forget
              </QuietButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
