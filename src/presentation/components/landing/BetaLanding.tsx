'use client';

import { useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { FloatingBubbles } from './FloatingBubbles';
import { ParallaxCards } from './ParallaxCards';
import { HeroSection } from './HeroSection';
import { BeforeAfterSection } from './BeforeAfterSection';
import { HowItWorksSection } from './HowItWorksSection';
import { FeaturesSection } from './FeaturesSection';
import { SocialProofSection } from './SocialProofSection';
import { RoadmapSection } from './RoadmapSection';
import { FAQSection } from './FAQSection';
import { FinalCTASection } from './FinalCTASection';
import { FooterSection } from './FooterSection';
import { StickyBottomCTA } from './StickyBottomCTA';

export function BetaLanding() {
  const signupRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const signupSuccess = searchParams.get('signup') === 'success';

  const scrollToSignup = () => {
    signupRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white">
      {/* 1. Hero + floating DM notifications + parallax cards */}
      <div className="relative">
        <ParallaxCards />
        <FloatingBubbles />
        <HeroSection onCtaClick={scrollToSignup} />
      </div>

      {/* 2. Before/After (merged pain+solution) */}
      <BeforeAfterSection onCtaClick={scrollToSignup} />

      {/* 3. How It Works */}
      <HowItWorksSection />

      {/* 4. Features */}
      <FeaturesSection />

      {/* 5. Social Proof */}
      <SocialProofSection />

      {/* 6. Roadmap */}
      <RoadmapSection />

      {/* 7. FAQ */}
      <FAQSection />

      {/* 8. Final CTA */}
      <FinalCTASection
        ref={signupRef}
        signupSuccess={signupSuccess}
      />

      {/* 9. Footer */}
      <FooterSection />

      {/* Sticky CTA (mobile) */}
      <StickyBottomCTA onCtaClick={scrollToSignup} />
    </div>
  );
}
