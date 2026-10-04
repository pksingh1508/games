// Gravity Is Lying's colours (Plan/15-gravity-is-lying.md §9): clean, bold shapes, a palette per
// world (lab white and teal, factory orange, gallery gold, town pastels, space purple, tree green
// and gold). Isaac is always apple red, and Newt's scarf always bright yellow: the truth stands out.
import type { WorldId } from "../core/room";

export const INK = "#163238";
export const ISAAC_RED = "#E63946";
export const SCARF = "#FFB703";
export const LEAF = "#52B788";
export const GOLD = "#F4B400";
export const DANGER = "#D7263D";

export interface WorldLook {
  /** Behind the room (the screen around it). */
  backdrop: [string, string];
  /** The room's air. */
  air: string;
  /** A faint pattern on the air. */
  grid: string;
  wall: string;
  wallEdge: string;
  /** The lit face of a wall (every face can be a floor). */
  wallFace: string;
  zone: string;
  zoneArrow: string;
  water: string;
  dust: string;
}

export const LOOKS: Record<WorldId, WorldLook> = {
  1: {
    backdrop: ["#DDEFEE", "#C6E3E1"],
    air: "#F2FBFA",
    grid: "rgba(15,115,102,0.07)",
    wall: "#2E4F55",
    wallEdge: "#1B3338",
    wallFace: "#5C8C91",
    zone: "rgba(69,196,176,0.22)",
    zoneArrow: "rgba(15,115,102,0.55)",
    water: "#4CC9F0",
    dust: "rgba(22,50,56,0.45)",
  },
  2: {
    backdrop: ["#FCE7CF", "#F6D3AE"],
    air: "#FFF6EC",
    grid: "rgba(242,140,40,0.1)",
    wall: "#4A3A30",
    wallEdge: "#2E231C",
    wallFace: "#8B6A55",
    zone: "rgba(242,140,40,0.2)",
    zoneArrow: "rgba(180,90,10,0.55)",
    water: "#3A86FF",
    dust: "rgba(74,58,48,0.45)",
  },
  3: {
    backdrop: ["#EFE4C7", "#E2D2A6"],
    air: "#FBF6E8",
    grid: "rgba(212,167,44,0.12)",
    wall: "#3B3024",
    wallEdge: "#231C14",
    wallFace: "#8C7448",
    zone: "rgba(212,167,44,0.22)",
    zoneArrow: "rgba(120,90,10,0.6)",
    water: "#3A86FF",
    dust: "rgba(59,48,36,0.45)",
  },
  4: {
    backdrop: ["#CDE8F7", "#F7E3EE"],
    air: "#EAF5FB",
    grid: "rgba(138,143,163,0.12)",
    wall: "#8A8FA3",
    wallEdge: "#5E6278",
    wallFace: "#B9BDCB",
    zone: "rgba(255,170,200,0.25)",
    zoneArrow: "rgba(170,60,110,0.55)",
    water: "#3A86FF",
    dust: "rgba(70,70,100,0.45)",
  },
  5: {
    backdrop: ["#140B26", "#2D1B4E"],
    air: "#1B1033",
    grid: "rgba(255,255,255,0.04)",
    wall: "#5A4A8A",
    wallEdge: "#2C2050",
    wallFace: "#8C7CD0",
    zone: "rgba(160,120,255,0.18)",
    zoneArrow: "rgba(220,200,255,0.55)",
    water: "#7FDBFF",
    dust: "rgba(230,220,255,0.65)",
  },
  6: {
    backdrop: ["#E3F2D2", "#F5E7B8"],
    air: "#F4FAEA",
    grid: "rgba(78,159,61,0.1)",
    wall: "#6B4F2A",
    wallEdge: "#47331A",
    wallFace: "#9C7A45",
    zone: "rgba(242,193,78,0.25)",
    zoneArrow: "rgba(140,100,10,0.6)",
    water: "#3A86FF",
    dust: "rgba(70,60,30,0.45)",
  },
};
