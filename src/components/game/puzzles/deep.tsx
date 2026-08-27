import { useEffect, useRef, useState } from "react";
import { blip, glitchBurst } from "@/lib/game/audio";
import { useGame } from "@/lib/game/store";
import { cn } from "@/lib/utils";
import { Door, QuietButton, QuietInput, StageFrame, Whisper } from "../ui";

export function ProximityStage() {
  const advance = useGame((s) => s.advance);
  const [glow, setGlow] = useState(0);
  const [breathe, setBreathe] = useState(false);
  const [dwell, setDwell] = useState(0);
  const target = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const hide = window.setTimeout(() => {
      document.body.style.cursor = "none";
      window.setTimeout(() => {
        document.body.style.cursor = "";
      }, 550);
    }, 280);
    const t = window.setInterval(() => {
      setBreathe(true);
      window.setTimeout(() => setBreathe(false), 1400);
    }, 2800);
    const d = window.setInterval(() => setDwell((n) => n + 1), 1000);
    return () => {
      window.clearTimeout(hide);
      window.clearInterval(t);
      window.clearInterval(d);
      document.body.style.cursor = "";
    };
  }, []);

  function track(clientX: number, clientY: number) {
    const el = target.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const d = Math.hypot(clientX - cx, clientY - cy);
    setGlow(Math.max(0, 1 - d / 160));
  }

  return (
    <StageFrame
      onPointerMove={(e) => track(e.clientX, e.clientY)}
      className="overflow-hidden"
    >
      <Whisper className="pointer-events-none absolute inset-x-0 top-8">
        look closer. the dead are shy.
      </Whisper>
      {dwell >= 6 ? (
        <p className="pointer-events-none absolute inset-x-0 top-16 text-center font-mono text-[10px] tracking-[0.28em] text-line">
          not the middle
        </p>
      ) : null}
      <button
        ref={target}
        type="button"
        aria-label="near"
        onClick={advance}
        className={cn(
          "absolute left-[68%] top-[38%] size-16 -translate-x-1/2 -translate-y-1/2 rounded-full sm:size-14",
          "border border-bone/50",
          breathe && "eye-pulse",
        )}
        style={{
          opacity: Math.max(glow, breathe ? 0.32 : dwell >= 10 ? 0.2 : 0.1),
        }}
      />
    </StageFrame>
  );
}

const WORDS = ["THE", "DOOR", "IS", "NOT", "A", "DOOR"] as const;
const TARGET = WORDS.join(" ");

export function SentenceStage() {
  const advance = useGame((s) => s.advance);
  const layer2 = useGame((s) => s.flags.layer2);
  const [picked, setPicked] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [fails, setFails] = useState(0);
  const [dwell, setDwell] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setDwell((d) => d + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const assembled = picked.map((p) => p.split("-")[0]).join(" ");
  const nextWord = WORDS[picked.length];

  function click(word: string, idx: number) {
    const next = [...picked, `${word}-${idx}`];
    const text = next.map((p) => p.split("-")[0]).join(" ");
    if (TARGET.startsWith(text)) {
      setPicked(next);
      blip("tick");
      if (text === TARGET) {
        window.setTimeout(() => setOpen(true), 400);
      }
    } else {
      setPicked([]);
      setFails((f) => f + 1);
      glitchBurst();
    }
  }

  const layout = [
    { word: "NOT", x: "12%", y: "22%" },
    { word: "DOOR", x: "70%", y: "18%" },
    { word: "THE", x: "38%", y: "8%" },
    { word: "A", x: "22%", y: "58%" },
    { word: "IS", x: "58%", y: "48%" },
    { word: "DOOR", x: "74%", y: "72%" },
  ];

  return (
    <StageFrame className="overflow-hidden">
      <p className="pointer-events-none absolute inset-x-0 top-6 text-center font-mono text-[10px] tracking-[0.35em] text-dust">
        {assembled || (dwell >= 8 ? "a sentence wants an order" : "· · ·")}
      </p>
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-28 -translate-x-1/2 -translate-y-1/2 border border-line" />
      <div className="relative h-[58vh] w-full max-w-lg">
        {layout.map((item, i) => {
          const id = `${item.word}-${i}`;
          const used = picked.includes(id);
          const isNext = !used && !open && item.word === nextWord;
          return (
            <button
              key={id}
              type="button"
              disabled={used || open}
              onClick={() => click(item.word, i)}
              className={cn(
                "absolute min-h-11 px-2 font-display text-2xl tracking-wide sm:text-3xl",
                used ? "text-line" : "text-bone/85 hover:text-bone",
                isNext && dwell >= 14 && "text-bone",
              )}
              style={{ left: item.x, top: item.y }}
            >
              {item.word}
            </button>
          );
        })}
        {open ? (
          <QuietButton
            onClick={advance}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-3xl tracking-[0.3em]"
          >
            OPEN
          </QuietButton>
        ) : null}
      </div>
      {fails >= 1 && !open ? (
        <p className="pointer-events-none absolute bottom-20 font-mono text-[10px] tracking-[0.2em] text-line">
          you have already read this
        </p>
      ) : null}
      {dwell >= 40 && !open ? (
        <p className="pointer-events-none absolute bottom-12 max-w-xs text-center font-sans text-[11px] tracking-wide text-dust/80">
          the door that is not a door
        </p>
      ) : null}
      {layer2 ? (
        <p className="absolute left-4 top-4 font-mono text-[10px] tracking-[0.3em] text-dust">
          OTHER
        </p>
      ) : null}
    </StageFrame>
  );
}

export function DoorsStage() {
  const advance = useGame((s) => s.advance);
  const unlockEnding = useGame((s) => s.unlockEnding);
  const cold = useGame((s) => s.cold);
  const setCold = useGame((s) => s.setCold);
  const flag = useGame((s) => s.flag);
  const [labels, setLabels] = useState(["EXIT", "EXIT", "EXIT"]);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setHint(true), 10000);
    return () => window.clearTimeout(t);
  }, []);

  function shuffle() {
    const opts = ["EXIT", "EXIT", "STAY"];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j] ?? "EXIT", opts[i] ?? "EXIT"];
    }
    setLabels([opts[0] ?? "EXIT", opts[1] ?? "EXIT", opts[2] ?? "EXIT"]);
  }

  return (
    <StageFrame>
      <div className="flex flex-col items-center gap-8">
        <div className="flex items-end gap-4 sm:gap-8" onPointerEnter={shuffle}>
          <Door
            label={labels[0] ?? "EXIT"}
            onPick={() => {
              flag("sawFakeExit");
              unlockEnding("false_dawn");
            }}
          />
          <Door label={labels[1] ?? "EXIT"} taller onPick={advance} />
          <Door
            label={labels[2] ?? "EXIT"}
            onPick={() => {
              const n = cold + 1;
              setCold(n);
              blip("warn");
              if (n >= 3) unlockEnding("stasis");
            }}
          />
        </div>
        {hint ? (
          <p className="font-mono text-[10px] tracking-[0.2em] text-line">
            height is a kind of honesty
          </p>
        ) : null}
      </div>
    </StageFrame>
  );
}

export function StaticStage() {
  const advance = useGame((s) => s.advance);
  const flag = useGame((s) => s.flag);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const idle = useRef(true);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!idle.current) return;
      setProgress((p) => {
        const n = p + 4;
        if (n >= 100) {
          setDone(true);
          flag("waitedStatic");
          return 100;
        }
        return n;
      });
    }, 280);
    return () => window.clearInterval(id);
  }, [flag]);

  return (
    <StageFrame>
      <button
        type="button"
        aria-label="static"
        onClick={() => {
          if (done) return;
          idle.current = false;
          setProgress(0);
          glitchBurst();
          if (progress > 20) useGame.getState().setWhisper("clicking harder won't help.");
          window.setTimeout(() => {
            idle.current = true;
          }, 400);
        }}
        className="absolute inset-0"
      />
      <div className="relative z-10 flex flex-col items-center gap-6">
        {done ? (
          <QuietButton onClick={advance} className="font-display text-3xl">
            ·
          </QuietButton>
        ) : (
          <p
            className="font-display text-xl tracking-[0.5em] text-bone/40"
            style={{ opacity: progress / 140 }}
          >
            WAIT
          </p>
        )}
      </div>
    </StageFrame>
  );
}

export function LetterStage() {
  const advance = useGame((s) => s.advance);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);
  const [dwell, setDwell] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDwell(true), 8000);
    return () => window.clearTimeout(t);
  }, []);

  function submit() {
    const v = value.trim().toLowerCase();
    if (v === "e" || v === "the letter e" || v === "letter e") {
      advance();
      return;
    }
    setWrong(true);
    glitchBurst();
    window.setTimeout(() => setWrong(false), 450);
  }

  function markE(line: string) {
    return line.split("").map((ch, i) =>
      ch.toLowerCase() === "e" ? (
        <span key={`${line}-${i}`} className="text-bone">
          {ch}
        </span>
      ) : (
        <span key={`${line}-${i}`}>{ch}</span>
      ),
    );
  }

  return (
    <StageFrame>
      <div className="flex max-w-md flex-col items-center gap-8 text-center">
        <p
          className={cn(
            "font-display text-2xl italic leading-snug text-ash sm:text-3xl",
            wrong && "glitch-once",
          )}
        >
          {markE("I am the beginning of the end,")}
          <br />
          {markE("and the end of time and space.")}
          <br />
          {markE("I am essential to creation,")}
          <br />
          {markE("and surround every place.")}
          <span
            className={cn(
              "mt-3 block font-sans text-[10px] not-italic tracking-[0.2em] text-line",
              dwell && "line-through decoration-ash",
            )}
          >
            spoiler: F
          </span>
        </p>
        {wrong ? (
          <p className="font-mono text-[10px] tracking-[0.2em] text-dust">not that</p>
        ) : null}
        <QuietInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          className="max-w-[8rem] text-center"
          aria-label="answer"
          autoComplete="off"
          autoCapitalize="off"
        />
      </div>
    </StageFrame>
  );
}
