import { useGame } from "@/lib/game/store";
import { Endings } from "./Endings";
import {
  AbsenceStage,
  ArriveStage,
  BootStage,
  InvertStage,
  PolicyStage,
} from "./puzzles/intro";
import {
  CrashStage,
  EnoughStage,
  IdentityStage,
  ListenStage,
  StayStage,
} from "./puzzles/middle";
import {
  DoorsStage,
  LetterStage,
  ProximityStage,
  SentenceStage,
  StaticStage,
} from "./puzzles/deep";
import { GazeStage, LeaveStage, LostStage, SealStage } from "./puzzles/endgame";
import {
  AdminStage,
  ConfessionStage,
  CookiesStage,
  CreditsStage,
  FaqStage,
  HelpdeskStage,
  InboxStage,
  ObituaryStage,
  OtherStage,
  SpoilersStage,
  SurveyStage,
} from "./puzzles/extra";
import type { StageId } from "@/lib/game/types";
import type { ComponentType } from "react";

const STAGES: Record<StageId, ComponentType> = {
  boot: BootStage,
  arrive: ArriveStage,
  policy: PolicyStage,
  cookies: CookiesStage,
  absence: AbsenceStage,
  invert: InvertStage,
  listen: ListenStage,
  stay: StayStage,
  crash: CrashStage,
  identity: IdentityStage,
  survey: SurveyStage,
  enough: EnoughStage,
  proximity: ProximityStage,
  sentence: SentenceStage,
  doors: DoorsStage,
  helpdesk: HelpdeskStage,
  static: StaticStage,
  letter: LetterStage,
  lost: LostStage,
  gaze: GazeStage,
  confession: ConfessionStage,
  seal: SealStage,
  credits: CreditsStage,
  leave: LeaveStage,
  ending: Endings,
  spoilers: SpoilersStage,
  inbox: InboxStage,
  obituary: ObituaryStage,
  admin: AdminStage,
  faq: FaqStage,
  other: OtherStage,
};

export function StageHost() {
  const stage = useGame((s) => s.stage);
  const View = STAGES[stage] ?? BootStage;
  return (
    <div key={stage} className="flex min-h-0 flex-1 flex-col">
      <View />
    </div>
  );
}
