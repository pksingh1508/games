"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { useSave } from "@/engine/save";
import { settingsSave, type MotionSetting } from "@/engine/settings";

const loadFeatures = () => import("@/lib/motion-features").then((mod) => mod.default);

const MOTION: Record<MotionSetting, "user" | "always" | "never"> = {
  system: "user",
  reduce: "always",
  full: "never",
};

export function AppProviders({ children }: { children: ReactNode }) {
  const settings = useSave(settingsSave);
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion={MOTION[settings.motion]}>{children}</MotionConfig>
    </LazyMotion>
  );
}
