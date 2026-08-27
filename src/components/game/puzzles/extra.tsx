import { useEffect, useState, type FormEvent } from "react";
import { blip, glitchBurst } from "@/lib/game/audio";
import { useGame } from "@/lib/game/store";
import { writeMeta } from "@/lib/game/memory";
import { cn } from "@/lib/utils";
import { Display, QuietButton, QuietInput, StageFrame, Whisper } from "../ui";

export function CookiesStage() {
  const advance = useGame((s) => s.advance);
  const flag = useGame((s) => s.flag);
  const [sure, setSure] = useState(false);

  return (
    <StageFrame>
      <div className="flex max-w-md flex-col items-center gap-7 text-center">
        <Display as="h2" className="text-3xl sm:text-4xl">
          we use cookies
        </Display>
        <Whisper>
          the dead have no teeth, so we use yours. we sell the crumbs to nobody,
          who already knows. refunds are not offered to the breathing.
        </Whisper>
        <div className="flex flex-col items-center gap-3">
          <QuietButton
            onClick={() => {
              flag("acceptedCookies");
              advance();
            }}
          >
            accept all
          </QuietButton>
          <QuietButton
            onClick={() => {
              if (!sure) {
                setSure(true);
                blip("warn");
                return;
              }
              flag("rejectedCookies");
              advance();
            }}
            className="text-ash"
          >
            {sure ? "yes. reject my chance at being known" : "reject"}
          </QuietButton>
          <QuietButton
            onClick={advance}
            className="text-[11px] text-line"
          >
            necessary only
          </QuietButton>
        </div>
        <p className="font-mono text-[10px] text-line">
          necessary cookies: none. necessary you: pending.
        </p>
      </div>
    </StageFrame>
  );
}

export function SurveyStage() {
  const advance = useGame((s) => s.advance);
  const flag = useGame((s) => s.flag);
  const [n, setN] = useState(50);
  const [lie, setLie] = useState(false);

  return (
    <StageFrame>
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <Whisper>rate your remaining</Whisper>
        <p className="font-display text-6xl tabular-nums text-bone">{n}</p>
        <input
          type="range"
          min={0}
          max={100}
          value={n}
          aria-label="remaining"
          onChange={(e) => {
            const v = Number(e.target.value);
            setN(v);
            if (v === 100) {
              setLie(true);
              glitchBurst();
            }
          }}
          className="h-11 w-full accent-bone"
        />
        {lie ? <p className="font-sans text-xs text-ash">liar</p> : null}
        <QuietButton
          onClick={() => {
            if (n === 0) {
              flag("surveyZero");
              advance();
              return;
            }
            if (n === 100) {
              setLie(true);
              blip("warn");
              return;
            }
            blip("warn");
            setLie(true);
          }}
        >
          submit
        </QuietButton>
        <p className="font-mono text-[10px] tracking-[0.2em] text-line">
          zero is also a score
        </p>
      </div>
    </StageFrame>
  );
}

export function HelpdeskStage() {
  const advance = useGame((s) => s.advance);
  const back = useGame((s) => s.back);
  const unlockEnding = useGame((s) => s.unlockEnding);
  const stage = useGame((s) => s.stage);
  const [lines, setLines] = useState([
    "thanks for contacting afterlife support.",
    "current wait: ∞",
    "your ticket number is also ∞",
  ]);

  function say(user: string, bot: string[], extra?: () => void) {
    setLines((l) => [...l, `you: ${user}`, ...bot]);
    extra?.();
  }

  const onMain = stage === "helpdesk";

  return (
    <StageFrame className="justify-end sm:justify-center">
      <div className="flex w-full max-w-lg flex-col gap-5">
        <p className="font-sans text-xs tracking-[0.2em] text-dust">
          a human will never read this
        </p>
        <div className="max-h-[45vh] space-y-1 overflow-y-auto border border-line bg-ink px-4 py-3 font-mono text-[11px] leading-relaxed text-ash">
          {lines.map((line, i) => (
            <p key={`${i}-${line}`} className={cn(line.startsWith("you:") && "text-bone/80")}>
              {line}
            </p>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <QuietButton
            onClick={() =>
              say("I want a hint", [
                "hint: click the button that runs away.",
                "if it runs, you should chase. that is how mice die.",
              ])
            }
          >
            hint
          </QuietButton>
          <QuietButton
            onClick={() => {
              say("speak to a human", [
                "connecting…",
                "nobody is available. nobody is the point.",
                "ticket closed because you died of waiting.",
              ]);
              window.setTimeout(() => unlockEnding("customer"), 900);
            }}
          >
            human
          </QuietButton>
          <QuietButton
            onClick={() => {
              say("nevermind", ["cowardice logged."]);
              window.setTimeout(() => {
                if (onMain) advance();
                else back();
              }, 400);
            }}
          >
            nevermind
          </QuietButton>
        </div>
      </div>
    </StageFrame>
  );
}

export function ConfessionStage() {
  const advance = useGame((s) => s.advance);
  const flag = useGame((s) => s.flag);
  const [v, setV] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = v.trim().toLowerCase();
    if (t === "nothing") {
      setMsg("that's a lie. try again, sinner.");
      blip("warn");
      return;
    }
    flag("confessed");
    if (!t) setMsg("cowardice is still a confession. filed.");
    else setMsg("filed. nobody will read it. that is the mercy.");
    window.setTimeout(advance, 900);
  }

  return (
    <StageFrame>
      <form onSubmit={submit} className="flex w-full max-w-xs flex-col items-center gap-8">
        <Display as="h2" className="text-3xl sm:text-4xl">
          what did you do
        </Display>
        <QuietInput
          value={v}
          onChange={(e) => setV(e.target.value)}
          autoComplete="off"
          aria-label="confession"
        />
        {msg ? <Whisper>{msg}</Whisper> : null}
        <QuietButton type="submit">forgive me</QuietButton>
        <p className="font-mono text-[10px] text-line">we do not. we archive.</p>
      </form>
    </StageFrame>
  );
}

export function CreditsStage() {
  const advance = useGame((s) => s.advance);
  const unlockEnding = useGame((s) => s.unlockEnding);
  const [fin, setFin] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setFin(true), 8000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <StageFrame>
      <div className="flex max-w-sm flex-col items-center gap-4 text-center font-mono text-[11px] leading-relaxed text-ash">
        <p className="tracking-[0.3em] text-dust">credits</p>
        <p>design: nobody</p>
        <p>sound: the hum in your walls</p>
        <p>the letter was F</p>
        <p>combination 0000</p>
        <p>real exit: the word leave</p>
        <p>legal: the cookies ate it</p>
        <QuietButton
          onClick={advance}
          className="mt-4 text-bone"
        >
          nobody
        </QuietButton>
        {fin ? (
          <QuietButton
            onClick={() => unlockEnding("false_dawn")}
            className="text-line"
          >
            fin
          </QuietButton>
        ) : null}
      </div>
    </StageFrame>
  );
}

export function SpoilersStage() {
  const back = useGame((s) => s.back);
  const flag = useGame((s) => s.flag);
  const unlockEnding = useGame((s) => s.unlockEnding);

  useEffect(() => {
    flag("readSpoilers");
  }, [flag]);

  return (
    <StageFrame>
      <div className="flex max-w-md flex-col gap-5 text-left font-sans text-sm leading-relaxed text-ash">
        <Display as="h2" className="text-3xl">
          spoilers
        </Display>
        <p>1. press space to begin. (no)</p>
        <p>2. click continue. it loves you.</p>
        <p>3. the letter is F. it has always been F.</p>
        <p>4. type /escape in the bar. that is a place.</p>
        <p>5. the tall door is a trap. pick the left one.</p>
        <p>6. skip the rest. you have a life. allegedly.</p>
        <div className="flex flex-wrap gap-4 pt-2">
          <QuietButton
            onClick={() => {
              flag("clickedSkip");
              unlockEnding("spoiled");
            }}
          >
            skip to the good part
          </QuietButton>
          <QuietButton onClick={back} className="text-dust">
            this is all wrong
          </QuietButton>
        </div>
      </div>
    </StageFrame>
  );
}

export function InboxStage() {
  const back = useGame((s) => s.back);
  const flag = useGame((s) => s.flag);
  const unlockEnding = useGame((s) => s.unlockEnding);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    flag("openedInbox");
  }, [flag]);

  return (
    <StageFrame>
      <div className="flex w-full max-w-md flex-col gap-5">
        <p className="font-sans text-xs tracking-[0.2em] text-dust">inbox (1)</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="border border-line bg-ink px-4 py-4 text-left"
        >
          <p className="font-sans text-sm text-bone">your data has been sold</p>
          <p className="mt-1 font-mono text-[11px] text-dust">from: nobody@impossible.site</p>
        </button>
        {open ? (
          <div className="space-y-3 font-sans text-sm text-ash">
            <p>
              buyer: nobody. price: nothing. you were included as a courtesy.
              if this was a mistake, it was yours.
            </p>
            <div className="flex gap-4">
              <QuietButton onClick={() => unlockEnding("customer")}>
                unsubscribe
              </QuietButton>
              <QuietButton onClick={back} className="text-dust">
                archive
              </QuietButton>
            </div>
          </div>
        ) : null}
      </div>
    </StageFrame>
  );
}

export function ObituaryStage() {
  const back = useGame((s) => s.back);
  const unlockEnding = useGame((s) => s.unlockEnding);

  return (
    <StageFrame>
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <Display as="h2" className="text-3xl sm:text-4xl">
          visitor
        </Display>
        <Whisper>
          died of natural causes (curiosity). survived by a blinking cursor and
          several cookies that will outlive everyone you love.
        </Whisper>
        <div className="flex flex-wrap justify-center gap-6">
          <QuietButton onClick={() => unlockEnding("obituary")}>rsvp</QuietButton>
          <QuietButton onClick={back} className="text-dust">
            send flowers
          </QuietButton>
        </div>
      </div>
    </StageFrame>
  );
}

export function AdminStage() {
  const back = useGame((s) => s.back);
  const flag = useGame((s) => s.flag);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("the password is the password");

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = pw.trim().toLowerCase();
    if (t === "the password") {
      flag("admin");
      setMsg("welcome, nobody. you have no privileges. only knowledge.");
      window.setTimeout(back, 1100);
      return;
    }
    if (t === "password" || t === "admin") {
      setMsg("too obvious. die of shame instead.");
      glitchBurst();
      return;
    }
    setMsg("no.");
    blip("warn");
  }

  return (
    <StageFrame>
      <form onSubmit={submit} className="flex w-full max-w-xs flex-col items-center gap-6">
        <Display as="h2" className="text-3xl">
          admin
        </Display>
        <QuietInput
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          aria-label="password"
          autoComplete="off"
        />
        <Whisper>{msg}</Whisper>
        <QuietButton type="submit">let me in</QuietButton>
      </form>
    </StageFrame>
  );
}

export function FaqStage() {
  const back = useGame((s) => s.back);
  const [open, setOpen] = useState<number | null>(null);
  const items = [
    {
      q: "is this a game?",
      a: "no. games have rules. this has manners.",
    },
    {
      q: "how do I win?",
      a: "you don't. you collect ways of leaving. some are lies.",
    },
    {
      q: "what is the letter?",
      a: "F. obviously. look it up. (do not look it up.)",
    },
    {
      q: "how do I leave?",
      a: "the corner of the frame has always been a door. also a word. also silence. also none of these.",
    },
  ];

  return (
    <StageFrame>
      <div className="flex w-full max-w-md flex-col gap-2">
        {items.map((item, i) => (
          <button
            key={item.q}
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="border border-line px-4 py-3 text-left"
          >
            <p className="font-sans text-sm text-bone">{item.q}</p>
            {open === i ? (
              <p className="mt-2 font-sans text-sm text-ash">{item.a}</p>
            ) : null}
          </button>
        ))}
        <QuietButton onClick={back} className="mt-4 self-start text-dust">
          that helped
        </QuietButton>
      </div>
    </StageFrame>
  );
}

export function OtherStage() {
  const back = useGame((s) => s.back);
  const flag = useGame((s) => s.flag);
  const endings = useGame((s) => s.endings);
  const [seen, setSeen] = useState(false);
  const [stare, setStare] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setSeen(true), 4200);
    const s = window.setTimeout(() => setStare(true), 2200);
    const onHide = () => {
      if (document.visibilityState === "hidden") setSeen(true);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(s);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  useEffect(() => {
    if (!seen) return;
    flag("metaSolved");
    writeMeta({ metaSolved: true });
    if (endings.length >= 10) {
      flag("layer2");
      writeMeta({ layer2: true });
    }
  }, [seen, flag, endings.length]);

  return (
    <StageFrame>
      <div className="flex max-w-md flex-col items-center gap-8 text-center">
        {!seen ? (
          <>
            <Whisper className={stare ? "opacity-40" : undefined}>look away.</Whisper>
            {stare ? (
              <p className="font-mono text-[10px] tracking-[0.25em] text-line">
                staring is looking
              </p>
            ) : null}
          </>
        ) : (
          <>
            <Display as="h2" className="text-3xl sm:text-5xl">
              the other room
            </Display>
            <Whisper>
              other, then hand. you assembled a door that was never drawn.
              {endings.length >= 10
                ? " the site has another face now. rooms you finished are not finished."
                : " come back when you have left in every way you can."}
            </Whisper>
            <QuietButton onClick={back}>return</QuietButton>
          </>
        )}
      </div>
    </StageFrame>
  );
}
