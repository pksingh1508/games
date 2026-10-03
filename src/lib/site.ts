// One place for the site's identity. "Mind Games" is a working title: change it here.
export const SITE = {
  name: "Mind Games",
  fullName: "Mind Games Arcade",
  tagline: "Fifteen games that lie to you. Fairly.",
  description:
    "Fifteen short browser games that lie to you, trap you and turn your own habits against you, but always play fair. No accounts, no database: your progress stays on your device.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
} as const;
