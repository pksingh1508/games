import type { ComponentType } from "react";
import type { GameSlug } from "../slugs";
import { AlmostThereCover } from "./AlmostThereCover";
import { CursorEscapeCover } from "./CursorEscapeCover";
import { DontBlinkCover } from "./DontBlinkCover";
import { DontTrustTheGameCover } from "./DontTrustTheGameCover";
import { FakeFloorCover } from "./FakeFloorCover";
import { GlitchRunCover } from "./GlitchRunCover";
import { GravityIsLyingCover } from "./GravityIsLyingCover";
import { LastPixelCover } from "./LastPixelCover";
import { NinetyNineSecondsCover } from "./NinetyNineSecondsCover";
import { NopeCover } from "./NopeCover";
import { OneMoreStepCover } from "./OneMoreStepCover";
import { OneTapChaosCover } from "./OneTapChaosCover";
import { PanicStackCover } from "./PanicStackCover";
import { TrapSprintCover } from "./TrapSprintCover";
import type { CoverProps } from "./types";
import { WrongDoorCover } from "./WrongDoorCover";

const COVERS: Record<GameSlug, ComponentType<CoverProps>> = {
  "one-more-step": OneMoreStepCover,
  nope: NopeCover,
  "99-seconds": NinetyNineSecondsCover,
  "dont-trust-the-game": DontTrustTheGameCover,
  "fake-floor": FakeFloorCover,
  trapsprint: TrapSprintCover,
  "glitch-run": GlitchRunCover,
  "almost-there": AlmostThereCover,
  "one-tap-chaos": OneTapChaosCover,
  "last-pixel": LastPixelCover,
  "panic-stack": PanicStackCover,
  "cursor-escape": CursorEscapeCover,
  "wrong-door": WrongDoorCover,
  "dont-blink": DontBlinkCover,
  "gravity-is-lying": GravityIsLyingCover,
};

/** A game's cover art. Server-rendered SVG: no JavaScript is shipped for it. */
export function GameCover({ slug, className, uid }: { slug: GameSlug } & CoverProps) {
  const Cover = COVERS[slug];
  return <Cover className={className} uid={uid ?? slug} />;
}
