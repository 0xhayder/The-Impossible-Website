import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/game/store";
import { addFrag } from "@/lib/game/memory";
import { blip } from "@/lib/game/audio";
import { cn } from "@/lib/utils";
import { Display, QuietButton, StageFrame, Whisper } from "../ui";

export function BootStage() {
  const advance = useGame((s) => s.advance);
  const inputRef = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState("");
  const [focused, setFocused] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
    const t = window.setTimeout(() => setHint(true), 10000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") advance();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [advance]);

  return (
    <StageFrame className="cursor-text">
      <div className="relative z-10 flex flex-col items-center gap-10">
        <button
          type="button"
          onClick={() => {
            const coarse =
              typeof window !== "undefined" &&
              window.matchMedia("(pointer: coarse)").matches;
            if (coarse) {
              advance();
              return;
            }
            if (focused) {
              advance();
              return;
            }
            inputRef.current?.focus();
            setFocused(true);
          }}
        >
          <Display className="enter-rise text-bone/90">THE IMPOSSIBLE WEBSITE</Display>
        </button>
        <button
          type="button"
          onClick={() => {
            const coarse =
              typeof window !== "undefined" &&
              window.matchMedia("(pointer: coarse)").matches;
            if (coarse) {
              advance();
              return;
            }
            inputRef.current?.focus();
            setFocused(true);
            if (hint) advance();
          }}
          className="enter-rise-delay flex min-h-11 items-end justify-center font-display text-2xl text-ash"
        >
          <span className="max-w-[12ch] truncate">{typed}</span>
          <span className="caret" />
        </button>
        <input
          ref={inputRef}
          value={typed}
          aria-label="speak"
          onFocus={() => setFocused(true)}
          onChange={(e) => setTyped(e.target.value.slice(0, 24))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              advance();
            }
          }}
          className="pointer-events-none absolute opacity-0"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>
    </StageFrame>
  );
}

export function ArriveStage() {
  const advance = useGame((s) => s.advance);
  const please = useGame((s) => s.flags.typedPlease);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [misses, setMisses] = useState(0);
  const [frozen, setFrozen] = useState(Boolean(please));
  const [showStill, setShowStill] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const idleRef = useRef<number | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setShowStill(true), 7000);
    return () => window.clearTimeout(t);
  }, []);

  function armIdle() {
    if (idleRef.current) window.clearTimeout(idleRef.current);
    idleRef.current = window.setTimeout(() => setFrozen(true), 6500);
  }

  useEffect(() => {
    armIdle();
    return () => {
      if (idleRef.current) window.clearTimeout(idleRef.current);
    };
  }, []);

  function flee(e: React.PointerEvent) {
    if (frozen) return;
    if (e.pointerType === "touch") return;
    armIdle();
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < 110 && dist > 0.5) {
      const nx = dx / dist;
      const ny = dy / dist;
      setPos((p) => {
        const x = Math.max(-140, Math.min(140, p.x - nx * 70));
        const y = Math.max(-90, Math.min(90, p.y - ny * 48));
        return { x, y };
      });
    }
  }

  return (
    <StageFrame onPointerMove={flee}>
      <div className="flex flex-col items-center gap-8">
        <Whisper className="enter-rise">you shouldn't be here. most people aren't.</Whisper>
        <div className="relative flex h-36 w-64 items-center justify-center sm:h-40 sm:w-80">
          <QuietButton
            ref={btnRef}
            style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
            onClick={() => {
              if (frozen) {
                advance();
                return;
              }
              setMisses((m) => m + 1);
              setPos({
                x: (Math.random() - 0.5) * 160,
                y: (Math.random() - 0.5) * 80,
              });
              blip("warn");
            }}
            className="relative z-10"
          >
            continue
          </QuietButton>
          {showStill || misses >= 3 ? (
            <QuietButton
              onClick={advance}
              className="absolute bottom-0 text-[11px] tracking-[0.3em] text-dust"
            >
              still
            </QuietButton>
          ) : null}
        </div>
      </div>
    </StageFrame>
  );
}

export function PolicyStage() {
  const advance = useGame((s) => s.advance);
  const flag = useGame((s) => s.flag);
  const [held, setHeld] = useState(false);
  const [ready, setReady] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    addFrag("other");
  }, []);

  function down() {
    setHeld(true);
    timer.current = window.setTimeout(() => {
      setReady(true);
      flag("heldPolicy");
      blip("ok");
    }, 1600);
  }
  function up() {
    setHeld(false);
    if (timer.current) window.clearTimeout(timer.current);
  }

  return (
    <StageFrame>
      <div className="flex max-w-md flex-col items-center gap-8">
        <Display as="h2" className="enter-rise text-3xl sm:text-4xl">
          before you enter
        </Display>
        <div className="enter-rise-delay space-y-3 text-pretty font-sans text-sm leading-relaxed text-ash">
          <p>
            nobody was invited. the rooms rearrange when they are believed. volume
            is a kind of honesty.{" "}
            <span className="tracking-[0.12em] text-bone/70">
              the door that is not a door
            </span>{" "}
            will wait. refunds are for the living. by continuing you agree to have
            already agreed.
          </p>
          <p className="text-dust">
            access is granted only to those who remain still. the{" "}
            <button
              type="button"
              onClick={() => addFrag("other")}
              className="text-ash"
            >
              other
            </button>{" "}
            hand is quieter. spoiler: continue is honest.
          </p>
        </div>
        <button
          type="button"
          onPointerDown={down}
          onPointerUp={up}
          onPointerLeave={up}
          className="flex min-h-11 items-center gap-3 px-2"
        >
          <span
            className={cn(
              "grid size-4 place-items-center border border-line transition-colors duration-150",
              (held || ready) && "border-bone/60 bg-bone",
            )}
          />
          <span className="font-sans text-sm tracking-wide text-ash">
            I understand
          </span>
        </button>
        {ready ? (
          <QuietButton onClick={advance} className="enter-rise">
            proceed
          </QuietButton>
        ) : null}
        <QuietButton
          onClick={() => {
            flag("declinedPolicy");
            advance();
          }}
          className="text-[11px] tracking-[0.2em] text-line hover:text-dust"
        >
          I do not
        </QuietButton>
      </div>
    </StageFrame>
  );
}

export function AbsenceStage() {
  const advance = useGame((s) => s.advance);
  const [open, setOpen] = useState(false);
  const [shake, setShake] = useState(false);

  return (
    <StageFrame>
      <div className="relative flex flex-col items-center gap-6">
        <p
          className={cn(
            "font-display text-7xl tracking-[-0.04em] text-bone sm:text-8xl",
            shake && "glitch-once",
          )}
        >
          4
          <button
            type="button"
            aria-label="zero"
            onClick={() => {
              setOpen(true);
              blip("tick");
            }}
            className={cn(
              "inline-block min-h-11 min-w-11 align-baseline transition-opacity duration-300",
              open ? "opacity-0" : "opacity-100",
            )}
          >
            0
          </button>
          4
        </p>
        {open ? (
          <QuietButton
            onClick={advance}
            className="absolute left-1/2 top-8 size-16 -translate-x-1/2 rounded-full"
            aria-label="hole"
          />
        ) : null}
        <Whisper>
          this page cannot be{" "}
          <button
            type="button"
            className="line-through decoration-dust"
            onClick={() => {
              setShake(true);
              blip("warn");
              window.setTimeout(() => setShake(false), 450);
            }}
          >
            found
          </button>
          . unlike you.
        </Whisper>
        <QuietButton
          onClick={() => {
            setShake(true);
            blip("warn");
            window.setTimeout(() => setShake(false), 450);
          }}
          className="text-dust"
        >
          return
        </QuietButton>
      </div>
    </StageFrame>
  );
}

export function InvertStage() {
  const advance = useGame((s) => s.advance);
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    addFrag("hand");
  }, []);

  return (
    <StageFrame>
      <div className="flex scale-y-[-1] flex-col items-center gap-8">
        <Whisper className="scale-y-[-1]">please use the button below. it is below.</Whisper>
        <QuietButton
          onClick={() => {
            setWrong(true);
            blip("warn");
          }}
          className="rotate-180"
        >
          this way
        </QuietButton>
        {wrong ? (
          <p className="scale-y-[-1] font-sans text-xs tracking-[0.2em] text-dust">
            not that way
          </p>
        ) : null}
      </div>
      <QuietButton
        onClick={advance}
        className="absolute bottom-10 text-[11px] tracking-[0.4em] text-dust/90 sm:bottom-14"
      >
        here
      </QuietButton>
      <p className="pointer-events-none absolute bottom-6 right-6 font-mono text-[10px] tracking-[0.35em] text-dust">
        HAND
      </p>
    </StageFrame>
  );
}
