import { useEffect, useRef, useState, type FormEvent } from "react";
import { blip, glitchBurst } from "@/lib/game/audio";
import { useGame } from "@/lib/game/store";
import { cn } from "@/lib/utils";
import { Display, QuietButton, QuietInput, StageFrame, Whisper } from "../ui";

export function ListenStage() {
  const advance = useGame((s) => s.advance);
  const flag = useGame((s) => s.flag);
  const setMuted = useGame((s) => s.setMuted);
  const [loud, setLoud] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setHint(true), 9000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <StageFrame>
      <div className="flex flex-col items-center gap-8">
        <Whisper className="enter-rise">the site is too quiet. it is listening anyway.</Whisper>
        <QuietButton
          onClick={() => {
            if (!loud) {
              setLoud(true);
              setMuted(false);
              glitchBurst();
              return;
            }
            setMuted(true);
            flag("silentListen");
            blip("ok");
            window.setTimeout(advance, 400);
          }}
          className="tracking-[0.25em]"
        >
          {loud ? "make it stop" : "listen"}
        </QuietButton>
        {loud ? (
          <p className="font-mono text-[11px] text-dust">signal present</p>
        ) : null}
        {hint && !loud ? (
          <p className="text-[11px] tracking-[0.2em] text-line">honesty is quiet</p>
        ) : null}
      </div>
    </StageFrame>
  );
}

export function StayStage() {
  const advance = useGame((s) => s.advance);
  const [msg, setMsg] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const stayAt = useRef<number | null>(null);

  function onRemain() {
    if (armed) {
      advance();
      return;
    }
    setMsg("…");
    if (stayAt.current) window.clearTimeout(stayAt.current);
    stayAt.current = window.setTimeout(() => {
      setArmed(true);
      setMsg("yes");
      blip("ok");
      window.setTimeout(advance, 900);
    }, 4000);
  }

  return (
    <StageFrame>
      <div className="flex flex-col items-center gap-10">
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          <QuietButton
            onClick={() => {
              setMsg("you left. there is no corridor. the door is not a door.");
              blip("warn");
            }}
          >
            leave
          </QuietButton>
          <QuietButton onClick={onRemain} className={armed ? "text-bone" : undefined}>
            remain
          </QuietButton>
          <QuietButton
            onClick={() => {
              setMsg("there is nothing to return to");
              blip("warn");
            }}
          >
            return
          </QuietButton>
        </div>
        {msg ? <Whisper className="min-h-6">{msg}</Whisper> : <div className="min-h-6" />}
      </div>
    </StageFrame>
  );
}

const TERMINAL_BOOT = [
  "Uncaught TypeError: Cannot read properties of undefined (reading 'exit')",
  "    at believe (core.js:7:13)",
  "    at Object.open (core.js:21:4)",
];

function runCommand(raw: string): {
  lines: string[];
  ok?: boolean;
  xyzzy?: boolean;
  about?: boolean;
  go?: "inbox" | "obituary" | "spoilers" | "admin";
} {
  const cmd = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!cmd) return { lines: [] };
  if (cmd === "help")
    return { lines: ["commands are not listed. listing would be mercy."] };
  if (cmd === "ls")
    return { lines: ["core.js    door    about    root    mail    spoiler    other"] };
  if (cmd === "cat core.js" || cmd === "cat")
    return { lines: ["function believe(site) {", "  return site.exit;", "}"] };
  if (cmd === "open" || cmd === "open door" || cmd === "door")
    return { lines: ["locked. so was the coffin. that opened."] };
  if (cmd === "believe") return { lines: ["…"], ok: true };
  if (cmd === "xyzzy") return { lines: ["a hollow voice says 'fool'"], xyzzy: true };
  if (cmd === "exit" || cmd === "escape")
    return { lines: ["nice try. dying is not a command."] };
  if (cmd === "sudo exit" || cmd === "sudo")
    return { lines: ["you are not in the sudoers file. you are in the ground."] };
  if (cmd === "root") return { lines: ["permission denied"] };
  if (cmd === "about")
    return { lines: ["a website that refuses to be one"], about: true };
  if (cmd === "whoami") return { lines: ["nobody. it suits you."] };
  if (cmd === "pwd") return { lines: ["/impossible"] };
  if (cmd === "look") return { lines: ["a site, or the idea of one, or a mouth."] };
  if (cmd === "hint")
    return { lines: ["type exit. (this is a lie.)"] };
  if (cmd === "please") return { lines: ["manners will not reboot the dead."] };
  if (cmd === "kill" || cmd === "killall")
    return { lines: ["you cannot kill what is not running."] };
  if (cmd === "mail" || cmd === "inbox") return { lines: ["1 unread"], go: "inbox" };
  if (cmd === "spoiler") return { lines: ["loading lies…"], go: "spoilers" };
  if (cmd === "rm -rf /" || cmd === "rm")
    return { lines: ["deleted nothing. nothing was already gone."] };
  if (cmd === "man") return { lines: ["no man. no manual."] };
  if (cmd === "clear") return { lines: ["__clear__"] };
  return { lines: ["command not found. like the others."] };
}

export function CrashStage() {
  const advance = useGame((s) => s.advance);
  const flag = useGame((s) => s.flag);
  const go = useGame((s) => s.go);
  const [log, setLog] = useState<string[]>(TERMINAL_BOOT);
  const [value, setValue] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [log]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const result = runCommand(value);
    if (result.xyzzy) flag("xyzzy");
    if (result.about) flag("openedAbout");
    if (result.go) {
      setLog((l) => [...l, `> ${value}`, ...result.lines]);
      window.setTimeout(() => go(result.go!), 400);
      setValue("");
      return;
    }
    if (result.ok) {
      setLog((l) => [...l, `> ${value}`, "…"]);
      window.setTimeout(advance, 500);
      return;
    }
    if (result.lines[0] === "__clear__") {
      setLog([]);
    } else {
      setLog((l) => [...l, `> ${value}`, ...result.lines]);
    }
    setValue("");
  }

  return (
    <StageFrame className="justify-end sm:justify-center">
      <div className="flex w-full max-w-lg flex-col gap-4">
        <p className="font-sans text-xs tracking-[0.2em] text-dust">something broke</p>
        <div
          ref={scroller}
          className="max-h-[50vh] overflow-y-auto border border-line bg-ink px-4 py-3 font-mono text-[11px] leading-relaxed text-ash sm:text-xs"
        >
          {log.map((line, i) => (
            <p key={`${i}-${line}`} className={cn(line.startsWith(">") && "text-bone/80")}>
              {line}
            </p>
          ))}
          <form onSubmit={submit} className="mt-2 flex items-center gap-2">
            <span className="text-dust">›</span>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="min-h-11 flex-1 bg-transparent text-bone caret-bone focus:outline-none"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="command"
            />
          </form>
        </div>
        <QuietButton
          onClick={() => {
            glitchBurst();
            setLog(TERMINAL_BOOT);
          }}
          className="self-start text-[11px] text-line"
        >
          reload this page
        </QuietButton>
      </div>
    </StageFrame>
  );
}

export function IdentityStage() {
  const advance = useGame((s) => s.advance);
  const flag = useGame((s) => s.flag);
  const [who, setWho] = useState("visitor");
  const [why, setWhy] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ghost, setGhost] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setGhost(true), 2200);
    return () => window.clearTimeout(t);
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const w = who.trim().toLowerCase();
    const y = why.trim().toLowerCase();
    const whyOk = [
      "leave",
      "to leave",
      "escape",
      "to escape",
      "out",
      "exit",
      "",
      "to die",
      "because",
      "i don't know",
    ].includes(y);
    if (w === "nobody" && whyOk) {
      flag("nobody");
      advance();
      return;
    }
    if (w === "nobody") {
      setErr("why");
      blip("warn");
      return;
    }
    setErr("we don't recognize you");
    blip("warn");
  }

  return (
    <StageFrame>
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-xs flex-col items-center gap-8"
      >
        <Display as="h2" className="text-3xl sm:text-4xl">
          who are you
        </Display>
        <label className="flex w-full flex-col gap-2">
          <span className="font-sans text-[11px] tracking-[0.2em] text-dust">
            identity
          </span>
          <QuietInput
            value={who}
            onChange={(e) => setWho(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
          />
          {ghost ? (
            <button
              type="button"
              onClick={() => setWho("nobody")}
              className="self-start font-mono text-[11px] text-line hover:text-ash"
            >
              nobody
            </button>
          ) : null}
        </label>
        <label className="flex w-full flex-col gap-2">
          <span className="font-sans text-[11px] tracking-[0.2em] text-dust">
            why are you here
          </span>
          <QuietInput
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
          />
        </label>
        {err ? <p className="font-sans text-xs text-ash">{err}</p> : null}
        <QuietButton type="submit">enter</QuietButton>
      </form>
    </StageFrame>
  );
}

export function EnoughStage() {
  const advance = useGame((s) => s.advance);
  const [n, setN] = useState(0);
  const [ghost, setGhost] = useState(false);
  const hold = useRef<number | null>(null);
  const usedHold = useRef(false);

  useEffect(() => {
    document.title = "13";
  }, []);

  useEffect(() => {
    if (n === 13) {
      const t = window.setTimeout(advance, 700);
      return () => window.clearTimeout(t);
    }
    if (n === 14) setGhost(true);
  }, [n, advance]);

  function inc() {
    setN((v) => {
      const next = v + 1;
      return next === 13 ? 14 : next;
    });
    blip("tick");
  }
  function dec() {
    setN((v) => Math.max(0, v - 1));
    blip("tick");
  }

  return (
    <StageFrame>
      <div className="flex flex-col items-center gap-6">
        <Whisper>enough. it never is.</Whisper>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (usedHold.current) {
                usedHold.current = false;
                return;
              }
              inc();
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              dec();
            }}
            onPointerDown={(e) => {
              usedHold.current = false;
              if (e.pointerType === "touch") {
                hold.current = window.setTimeout(() => {
                  usedHold.current = true;
                  dec();
                }, 480);
              } else {
                hold.current = window.setTimeout(() => {
                  usedHold.current = true;
                  dec();
                }, 700);
              }
            }}
            onPointerUp={() => {
              if (hold.current) window.clearTimeout(hold.current);
            }}
            onPointerLeave={() => {
              if (hold.current) window.clearTimeout(hold.current);
            }}
            className="min-h-24 min-w-24 font-display text-7xl tabular-nums tracking-[-0.04em] text-bone"
          >
            {n}
          </button>
          {ghost && n === 14 ? (
            <>
              <span className="pointer-events-none absolute -right-12 top-1/2 -translate-y-1/2 font-display text-3xl text-dust">
                13
              </span>
              <span className="pointer-events-none absolute -right-2 top-2 h-8 w-px bg-bone/40" />
            </>
          ) : null}
        </div>
        {n >= 8 && n !== 14 ? (
          <p className="font-mono text-[10px] tracking-[0.28em] text-line">the other hand</p>
        ) : null}
        {n === 14 ? (
          <p className="font-mono text-[10px] tracking-[0.28em] text-dust">not this hand</p>
        ) : null}
      </div>
    </StageFrame>
  );
}
