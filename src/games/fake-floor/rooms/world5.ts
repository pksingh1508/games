// World 5: The Painting (Plan/05-fake-floor.md §5). A world inside a giant painting, where some
// floors are only paint: they hang on the background, a little further back than the real ones,
// so they slide when the view moves (look ahead and watch). Later rooms bring the old tells back.
// Rooms 1–3 have safety nets.
import type { RoomSource } from "../core/room";
import { build } from "./build";

export const WORLD_5: RoomSource[] = [
  {
    id: "5-01",
    name: "Wet Paint",
    pebbles: 0,
    env: { parallax: 0.88 },
    signs: ["Look ahead and watch: paint slides, floors don't."],
    map: build([
      ".S.s.....................................D..", //
      "####========##==p===##=====p=====###########",
    ], { nets: "all" }),
  },
  {
    id: "5-02",
    name: "Brushwork",
    pebbles: 1,
    env: { parallax: 0.88 },
    map: build([
      ".S.............................................D..", //
      "####===p====pp==##=p===p===##==pp====p==##########",
    ], { nets: "all" }),
  },
  {
    // A painting of the rain: paint never splashes.
    id: "5-03",
    name: "Landscape",
    pebbles: 1,
    env: { rain: "steady" },
    map: build([
      ".S...............................................D..", //
      "####==p=ii=p==##ii==pp=i=###=p=iii=p=f##=ii=p====###",
    ], { nets: "all" }),
  },
  {
    id: "5-04",
    name: "Crackle Glaze",
    pebbles: 2,
    map: build([
      ".S.................................................D..", //
      "####cc=pcc=p##ccppcc==###=c=p=c=pp=c##p=cc=p=c########",
    ]),
  },
  {
    // A night painting with lanterns: painted floors have painted shadows. They don't swing.
    id: "5-05",
    name: "Starry Night",
    pebbles: 2,
    env: { lantern: true, dark: 0.72 },
    map: build([
      "........L...........L...........L...........L...........",
      "........................................................",
      "........................................................",
      "........................................................",
      ".S...................................................D..",
      "####=p==f=p=##pp==p=f=###=f=pp==p=##p==f=pp==###########",
    ]),
  },
  {
    // Plan §5: "a room where half the floors are painted". A pebble on a ledge past the top floor.
    id: "5-06",
    name: "Gallery",
    pebbles: 3,
    env: { parallax: 0.92 },
    map: build([
      ".........................................h................",
      "........................................%%................",
      "..........................o...............................",
      "..........................##=pp=p==p=p....................",
      ".S............##p==pp=p=p=............##...............D..",
      "####=p=p==pp=p..........................p=p=pp==p=########",
    ]),
  },
  {
    // The Showroom's tiles, in paint: grout and paint, together.
    id: "5-07",
    name: "Mosaic",
    pebbles: 2,
    env: { grout: true },
    map: build([
      ".S.................................................D..", //
      "####==f=p==f##p=ff=p==##=f=pp=f=###f==p=f=pp##########",
    ]),
  },
  {
    // The key and back: on the way back, the paint is seen from the wrong side.
    id: "5-08",
    name: "Restoration",
    pebbles: 2,
    map: build([
      ".S.D.................................................k..", //
      "#####=r=p==r=p=##p=r==p=r==####=rp=p==r=p==#############",
    ]),
  },
  {
    // Deeper paint: it slides less. A pebble on a ledge above it all.
    id: "5-09",
    name: "Perspective",
    pebbles: 2,
    env: { parallax: 0.95 },
    map: build([
      "..........................h.................................",
      ".........................%%.................................",
      "............................................................",
      "......................##....................................",
      "............##p=pp=p==..=p=p==pp.........................D..",
      ".S..............................##........##=pp=p=p=########",
      "####=p==p=p=......................p==p=pp=..................",
    ]),
  },
  {
    id: "5-10",
    name: "The Frame",
    pebbles: 3,
    env: { rain: "steady", parallax: 0.93 },
    signs: ["The edge of the painting.", "Below it, something is breathing."],
    map: build([
      "...........................o........................................................",
      "...........................##=p=c=pp=i=.............................................",
      ".S.s...........##pp=ii=f==p............###c=p=f=ii=p##..................s.......D...",
      "#####=p=i=f=c=p.......................................=pp=c=f=i=p=c=################",
    ]),
  },
];
