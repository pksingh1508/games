import { Faq } from "@/components/landing/Faq";
import { FinalCta } from "@/components/landing/FinalCta";
import { GamesSection } from "@/components/landing/GamesSection";
import { Hero } from "@/components/landing/Hero";
import { MarqueeBands } from "@/components/landing/MarqueeBands";
import { PrivacyPromise } from "@/components/landing/PrivacyPromise";
import { Rules } from "@/components/landing/Rules";
import { SpotTheTell } from "@/components/landing/SpotTheTell";
import { Workshop } from "@/components/landing/Workshop";
import { SectionHeading } from "@/components/ui/SectionHeading";

export default function Home() {
  return (
    <>
      <Hero />
      <MarqueeBands />
      <GamesSection />
      <SpotTheTell />
      <Rules />
      <Workshop />
      <PrivacyPromise />
      <section className="mx-auto max-w-4xl px-4 pt-32 sm:px-6" aria-labelledby="faq-title">
        <SectionHeading
          id="faq-title"
          level="Level 06"
          eyebrow="Help screen"
          title="Questions, answered honestly."
          align="center"
        />
        <div className="mt-12">
          <Faq />
        </div>
      </section>
      <FinalCta />
    </>
  );
}
