import { ENDINGS, type EndingId } from "@/lib/game/types";
import { useGame } from "@/lib/game/store";
import { readMeta } from "@/lib/game/memory";
import { BuiltBy, Display, QuietButton, StageFrame, Whisper } from "./ui";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const COPY: Record<
  EndingId,
  { title: string; body: string; canReturn: boolean; tone: string }
> = {
  egress: {
    title: "you left",
    body: "the site remains. it always did. you were the only moving part.",
    canReturn: false,
    tone: "text-bone",
  },
  false_dawn: {
    title: "thank you for visiting",
    body: "please rate your experience. please die on the way out. please come again.",
    canReturn: true,
    tone: "text-bone brightness-125",
  },
  unwritten: {
    title: "goodbye",
    body: "some exits are just a word you were willing to say.",
    canReturn: false,
    tone: "text-ash",
  },
  root: {
    title: "you were never supposed to read this",
    body: "the rooms were always the same room. the lock was a courtesy.",
    canReturn: false,
    tone: "glitch-once",
  },
  stasis: {
    title: "you stayed",
    body: "the page cools. remaining is also a kind of ending.",
    canReturn: true,
    tone: "opacity-50",
  },
  quiet: {
    title: "silence was the door",
    body: "",
    canReturn: false,
    tone: "opacity-80",
  },
  customer: {
    title: "ticket closed",
    body: "reason: customer deceased. reference: ∞. a survey will not follow.",
    canReturn: true,
    tone: "font-mono",
  },
  spoiled: {
    title: "you cheated",
    body: "the good part was the waiting. you skipped your own funeral.",
    canReturn: true,
    tone: "text-ash",
  },
  product: {
    title: "your data left",
    body: "you did not. we packed the clicks. the body stayed. that is the business model.",
    canReturn: false,
    tone: "tracking-[0.2em]",
  },
  obituary: {
    title: "visitor",
    body: "0 seconds old. survived by a cursor. rsvp: too late.",
    canReturn: true,
    tone: "opacity-70",
  },
};

function egressBody(): string {
  const m = readMeta();
  if (m.spam > 48) return "you don't wait. you left anyway. the door is tired.";
  if (m.address > 10) return "you looked in every empty room. then you left through the corner.";
  if (m.waits > 18) return "you learned. the site is quieter for it.";
  if (m.resets > 0) return "you asked it to forget. it let you leave anyway.";
  return "the site remains. it always did. you were the only moving part.";
}

export function Endings() {
  const ending = useGame((s) => s.ending) ?? "egress";
  const endings = useGame((s) => s.endings);
  const reset = useGame((s) => s.reset);
  const returnFromEnding = useGame((s) => s.returnFromEnding);
  const flag = useGame((s) => s.flag);
  const copy = COPY[ending];
  const complete = endings.length >= ENDINGS.length;
  const [phase, setPhase] = useState(0);
  const [credit, setCredit] = useState(false);

  useEffect(() => {
    const c = window.setTimeout(() => setCredit(true), 7000);
    return () => window.clearTimeout(c);
  }, [ending]);

  useEffect(() => {
    if (!complete) return;
    const a = window.setTimeout(() => setPhase(1), 1600);
    const b = window.setTimeout(() => {
      setPhase(2);
      flag("layer2");
    }, 4200);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [complete, flag]);

  const body = ending === "egress" ? egressBody() : copy.body;

  return (
    <StageFrame
      className={cn(
        ending === "stasis" && "opacity-60",
        ending === "quiet" && "bg-void",
        ending === "false_dawn" && "brightness-110",
        ending === "product" && "tracking-wide",
      )}
    >
      <div className="flex max-w-lg flex-col items-center gap-8 text-center">
        {complete && phase >= 1 ? (
          <>
            <Display className="enter-rise">you found everything.</Display>
            {phase >= 2 ? (
              <Whisper className="enter-rise-delay">or did you?</Whisper>
            ) : null}
          </>
        ) : (
          <>
            <Display className={cn("enter-rise", copy.tone)}>{copy.title}</Display>
            {body ? <Whisper className="enter-rise-delay">{body}</Whisper> : <div className="h-8" />}
          </>
        )}

        {ending === "root" && phase < 1 ? (
          <ul className="enter-rise-late w-full max-w-xs space-y-1 text-left font-mono text-[11px] text-dust">
            <li>/other</li>
            <li>/end/{ending}</li>
            <li className="text-ash">
              collected {endings.length}/{ENDINGS.length}
            </li>
          </ul>
        ) : null}

        {ending === "customer" ? (
          <p className="font-mono text-[10px] text-line">hold music: none</p>
        ) : null}

        <div className="enter-rise-late flex flex-wrap items-center justify-center gap-6 pt-4">
          {copy.canReturn && phase < 2 ? (
            <QuietButton onClick={returnFromEnding}>return</QuietButton>
          ) : null}
          <QuietButton onClick={reset} className="text-ash">
            begin again
          </QuietButton>
        </div>

        {complete && phase >= 2 ? (
          <p className="font-mono text-[10px] tracking-[0.2em] text-dust">
            the rooms have another face
          </p>
        ) : (
          <p className="font-mono text-[10px] tracking-[0.2em] text-line">
            {endings.length} of {ENDINGS.length} ways to be done
          </p>
        )}

        {credit ? <BuiltBy className="enter-rise-late pt-6" /> : null}
      </div>
    </StageFrame>
  );
}
