import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, X } from "lucide-react";
import { ENDINGS, MAIN_PATH, STAGE_TITLE } from "@/lib/game/types";
import { applyPath, interpretPath } from "@/lib/game/secrets";
import { useGame } from "@/lib/game/store";
import { blip } from "@/lib/game/audio";
import { cn } from "@/lib/utils";

export function Chrome() {
  const stage = useGame((s) => s.stage);
  const path = useGame((s) => s.path);
  const muted = useGame((s) => s.muted);
  const flags = useGame((s) => s.flags);
  const endings = useGame((s) => s.endings);
  const visited = useGame((s) => s.visited);
  const whisper = useGame((s) => s.whisper);
  const setMuted = useGame((s) => s.setMuted);
  const unlockEnding = useGame((s) => s.unlockEnding);
  const setForgetOpen = useGame((s) => s.setForgetOpen);
  const setWhisper = useGame((s) => s.setWhisper);

  const [draft, setDraft] = useState(path);
  const [msg, setMsg] = useState<string | null>(null);
  const [xClicks, setXClicks] = useState(0);
  const [marks, setMarks] = useState(0);
  const holdRef = useRef<number | null>(null);

  const ticks = MAIN_PATH.filter((id) => visited.includes(id)).length;
  const total = MAIN_PATH.length;
  const status = msg || whisper || null;

  useEffect(() => {
    setDraft(path);
    if (flags.layer2) {
      document.title =
        stage === "boot" ? "THE POSSIBLE WEBSITE" : STAGE_TITLE[stage] || "possible";
      document.documentElement.classList.add("layer-two");
    } else {
      document.title = STAGE_TITLE[stage] || "THE IMPOSSIBLE WEBSITE";
      document.documentElement.classList.remove("layer-two");
    }
  }, [path, stage, flags.layer2]);

  function submitPath(raw: string) {
    const result = interpretPath(raw);
    setDraft(result.path);
    setMsg(null);
    setWhisper("");
    const msg = applyPath(raw);
    if (msg) setMsg(msg);
  }

  function onX() {
    if (flags.canEgress && (stage === "leave" || stage === "ending")) {
      if (flags.silentListen && muted) {
        unlockEnding("quiet");
        return;
      }
      if (flags.acceptedCookies) {
        unlockEnding("product");
        return;
      }
      unlockEnding("egress");
      return;
    }
    const n = xClicks + 1;
    setXClicks(n);
    blip("warn");
    if (n === 1) setMsg("the living close windows. you are not that.");
    if (n >= 3) setMsg("not yet. dying takes paperwork.");
  }

  function startHold() {
    holdRef.current = window.setTimeout(() => setForgetOpen(true), 1600);
  }
  function endHold() {
    if (holdRef.current) window.clearTimeout(holdRef.current);
  }

  return (
    <header className="relative z-30 flex h-12 shrink-0 items-center gap-2 border-b border-line px-3 sm:h-14 sm:px-4">
      <button
        type="button"
        aria-label="mark"
        onClick={() => {
          const n = marks + 1;
          setMarks(n);
          if (n % 5 === 0) setForgetOpen(true);
        }}
        className="size-3 shrink-0 rounded-sm bg-bone/80 transition-transform duration-150 active:scale-90"
      />

      <form
        className="min-w-0 flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          submitPath(draft);
        }}
      >
        <label className="flex min-w-0 items-center gap-1 font-mono text-[11px] tracking-tight text-ash sm:text-xs">
          <span className="hidden text-dust sm:inline">
            {flags.layer2 ? "possible.site" : "impossible.site"}
          </span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label="address"
            className="min-h-11 min-w-0 flex-1 bg-transparent text-base text-bone caret-bone focus:outline-none sm:text-xs"
          />
        </label>
      </form>

      {status ? (
        <p className="max-w-[32%] truncate font-mono text-[10px] text-dust sm:max-w-[36%]">
          {status}
        </p>
      ) : null}

      <button
        type="button"
        aria-label="progress"
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        className="flex h-11 items-center gap-px px-1"
      >
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn("h-2.5 w-px sm:h-3", i < ticks ? "bg-bone/55" : "bg-line")}
          />
        ))}
      </button>

      <div className="hidden items-center gap-0.5 sm:flex" aria-hidden="true">
        {Array.from({ length: ENDINGS.length }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "size-1 rounded-full",
              i < endings.length ? "bg-bone/70" : "bg-line",
            )}
          />
        ))}
      </div>

      <button
        type="button"
        aria-label={muted ? "sound off" : "sound on"}
        onClick={() => setMuted(!muted)}
        className="grid size-11 place-items-center text-ash transition-colors duration-150 hover:text-bone touch-manipulation"
      >
        {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>

      <button
        type="button"
        aria-label="close"
        onClick={onX}
        className={cn(
          "grid size-11 place-items-center text-ash transition-colors duration-150 hover:text-bone touch-manipulation",
          flags.canEgress && stage === "leave" && "text-bone",
        )}
      >
        <X className="size-4" />
      </button>
    </header>
  );
}
