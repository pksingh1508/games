// Every room, by camera: the five museum cameras and your own office.
import type { CameraId } from "../core/types";
import { CORRIDOR } from "./corridor";
import { GALLERY } from "./gallery";
import { LOBBY } from "./lobby";
import { OFFICE } from "./office";
import type { Scene } from "./scene";
import { SCULPTURE } from "./sculpture";
import { STORAGE } from "./storage";

export const SCENES: Record<CameraId, Scene> = {
  lobby: LOBBY,
  gallery: GALLERY,
  sculpture: SCULPTURE,
  storage: STORAGE,
  corridor: CORRIDOR,
  office: OFFICE,
};
