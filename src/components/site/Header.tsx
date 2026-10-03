import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { AchievementsButton } from "./AchievementsButton";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";
import { SoundToggle } from "./SoundToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[#0E0B16]/80 backdrop-blur-xl" data-theme="hub">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="mr-auto rounded-xl" aria-label="Mind Games Arcade: home" data-sound="tick">
          <Logo />
        </Link>
        <NavLinks />
        <div className="flex items-center gap-1">
          <AchievementsButton />
          <SoundToggle />
          <ButtonLink href="/games" size="sm" className="ml-2 hidden sm:inline-flex">
            ▶ Press Start
          </ButtonLink>
          <MobileMenu />
        </div>
      </nav>
      {/* Scroll-linked "XP bar" */}
      <div aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 overflow-hidden">
        <div className="scroll-progress h-full w-full bg-gradient-to-r from-accent via-lie to-truth" />
      </div>
    </header>
  );
}
