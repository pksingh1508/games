export const NAV_ITEMS = [
  { href: "/games", label: "Games" },
  { href: "/about", label: "How it works" },
  { href: "/data", label: "Your data" },
  { href: "/settings", label: "Settings" },
] as const;

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
