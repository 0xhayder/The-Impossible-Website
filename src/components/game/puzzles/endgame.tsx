import { useEffect, useRef, useState } from "react";
import { blip, glitchBurst } from "@/lib/game/audio";
import { canOpenRoot } from "@/lib/game/secrets";
import { useGame } from "@/lib/game/store";
import { cn } from "@/lib/utils";
import { Display, QuietButton, StageFrame, Whisper } from "../ui";

export function LostStage() {
  const advance = useGame((s) => s.advance);
  const setPath = useGame((s) => s.setPath);
  const [note, setNote] = useState("you are lost");

  useEffect(() => {
    const t = window.setTimeout(() => setNote("some addresses are found"), 5000);
    return () => window.clearTimeout(t);
  }, []);

  const revealed = note !== "you are lost";

  return (
    <StageFrame>
      <div className="flex flex-col items-center gap-8">
        {revealed ? (
          <button
            type="button"
            onClick={() => {
              setPath("/found");
              advance();
            }}
          >
            <Display className="enter-rise">found</Display>
          </button>
        ) : (
          <Display className="enter-rise">lost</Display>
        )}
        <Whisper className="enter-rise-delay">{note}. funerals get better directions.</Whisper>
      </div>
    </StageFrame>
  );
}

export function GazeStage() {
  const advance = useGame((s) => s.advance);
  const flag = useGame((s) => s.flag);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [still, setStill] = useState(false);
  const idle = useRef<number | null>(null);
  const stillRef = useRef(false);

  function armStill() {
    if (stillRef.current) return;
    if (idle.current) window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => {
      stillRef.current = true;
      setStill(true);
      setPupil({ x: 0, y: 0 });
      flag("thirdEye");
    }, typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches ? 2200 : 3200);
  }

  function look(e: React.PointerEvent<HTMLElement>) {
    if (stillRef.current) return;
    armStill();
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    setPupil({
      x: Math.max(-1, Math.min(1, nx)) * 7,
      y: Math.max(-1, Math.min(1, ny)) * 5,
    });
  }

  useEffect(() => {
    armStill();
    return () => {
      if (idle.current) window.clearTimeout(idle.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StageFrame onPointerMove={look} className="gap-10">
      <Whisper>don't look</Whisper>
      <div className="flex items-center gap-10 sm:gap-16">
        <Eye x={still ? 0 : pupil.x} y={still ? 0 : pupil.y} />
        {still ? (
          <button
            type="button"
            aria-label="third"
            onClick={advance}
            className="enter-rise grid size-14 place-items-center rounded-full border border-bone/50 sm:size-16"
          >
            <span className="size-3 rounded-full bg-bone" />
          </button>
        ) : (
          <span className="size-14 sm:size-16" />
        )}
        <Eye x={still ? 0 : pupil.x} y={still ? 0 : pupil.y} />
      </div>
    </StageFrame>
  );
}

function Eye({ x, y }: { x: number; y: number }) {
  return (
    <div className="relative grid h-16 w-10 place-items-center rounded-full border border-bone/60 sm:h-20 sm:w-12">
      <span
        className="size-2.5 rounded-full bg-bone sm:size-3"
        style={{ transform: `translate(${x}px, ${y}px)` }}
      />
    </div>
  );
}

const GLYPHS = ["4", "0", "E", "○", "N", "/"] as const;
const COMBO = ["4", "0", "4", "E"] as const;

export function SealStage() {
  const advance = useGame((s) => s.advance);
  const [wheels, setWheels] = useState(["○", "○", "○", "○"]);
  const [shake, setShake] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setHint(true), 12000);
    return () => window.clearTimeout(t);
  }, []);

  function cycle(i: number, dir: 1 | -1) {
    setWheels((w) => {
      const next = [...w];
      const cur = next[i] ?? "○";
      const idx = GLYPHS.indexOf(cur as (typeof GLYPHS)[number]);
      const ni = (idx + dir + GLYPHS.length) % GLYPHS.length;
      next[i] = GLYPHS[ni] ?? "○";
      return next;
    });
    blip("tick");
  }

  function confirm() {
    if (wheels.join("") === COMBO.join("")) {
      advance();
      return;
    }
    setShake(true);
    glitchBurst();
    window.setTimeout(() => setShake(false), 450);
  }

  return (
    <StageFrame>
      <div className="flex flex-col items-center gap-10">
        <Whisper>
          the lock remembers what you have seen. it does not forgive it.
          <span className="mt-2 block font-mono text-[10px] tracking-[0.18em] text-line">
            a missing page. a letter.
          </span>
        </Whisper>
        <div className={cn("flex gap-3 sm:gap-5", shake && "glitch-once")}>
          {wheels.map((g, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <QuietButton
                aria-label="up"
                onClick={() => cycle(i, 1)}
                className="min-h-11 px-3 text-dust"
              >
                +
              </QuietButton>
              <div className="grid size-14 place-items-center border border-line font-display text-3xl text-bone sm:size-16">
                {g}
              </div>
              <QuietButton
                aria-label="down"
                onClick={() => cycle(i, -1)}
                className="min-h-11 px-3 text-dust"
              >
                −
              </QuietButton>
            </div>
          ))}
        </div>
        <QuietButton onClick={confirm}>turn</QuietButton>
        {hint ? (
          <p className="font-mono text-[10px] tracking-[0.3em] text-line">4 · 0 · 4 · e</p>
        ) : null}
      </div>
    </StageFrame>
  );
}

export function LeaveStage() {
  const unlockEnding = useGame((s) => s.unlockEnding);
  const remain = useGame((s) => s.remain);
  const setRemain = useGame((s) => s.setRemain);
  const flags = useGame((s) => s.flags);
  const muted = useGame((s) => s.muted);
  const [crack, setCrack] = useState(false);
  const [word, setWord] = useState(false);

  useEffect(() => {
    if (flags.konami) setCrack(true);
    const t = window.setTimeout(() => setWord(true), 8000);
    return () => window.clearTimeout(t);
  }, [flags.konami]);

  const rootReady = canOpenRoot(flags);

  return (
    <StageFrame>
      <div className="flex flex-col items-center gap-10">
        <Display className="enter-rise text-3xl sm:text-5xl">you may go</Display>
        <div className="enter-rise-delay flex flex-wrap items-center justify-center gap-8">
          <QuietButton onClick={() => unlockEnding("false_dawn")}>leave</QuietButton>
          <QuietButton
            onClick={() => {
              const n = remain + 1;
              setRemain(n);
              blip("tick");
              if (n >= 8) unlockEnding("stasis");
            }}
          >
            remain
          </QuietButton>
          {flags.acceptedCookies ? (
            <QuietButton
              onClick={() => unlockEnding("product")}
              className="text-dust"
            >
              take my data
            </QuietButton>
          ) : null}
        </div>
        <Whisper className="enter-rise-late max-w-xs text-dust">
          the corner of the frame has always been a door. we kept the liver.
          {flags.typedGoodbye ? " a word also works." : ""}
        </Whisper>
        {word && !flags.typedGoodbye ? (
          <p className="font-mono text-[10px] tracking-[0.22em] text-line">
            funerals start with goodbye
          </p>
        ) : null}
        {crack ? (
          <button
            type="button"
            aria-label="crack"
            onClick={() => {
              if (rootReady) unlockEnding("root");
              else if (muted && flags.silentListen) unlockEnding("quiet");
              else blip("warn");
            }}
            className="h-11 w-32 sm:w-48"
          >
            <span className="block h-px w-full bg-bone/50" />
          </button>
        ) : null}
      </div>
    </StageFrame>
  );
}
