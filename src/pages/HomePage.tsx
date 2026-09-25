import { useEffect } from "react";
import { scrollToSection } from "../lib/scrollToSection";
import { HeroSection } from "../components/sections/HeroSection";
import { WhySection } from "../components/sections/WhySection";
import { TracksSection } from "../components/sections/TracksSection";
import { QuizMapSection } from "../components/quiz/QuizMapSection";
import { WhoSection } from "../components/sections/WhoSection";

export function HomePage() {
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    requestAnimationFrame(() => scrollToSection(hash));
  }, []);

  return (
    <main>
        <HeroSection />
        <TracksSection />
        <QuizMapSection />
        <WhySection />
        <WhoSection />
    </main>
  );
}
