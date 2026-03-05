'use client';

import { useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { FloatingBubbles } from './FloatingBubbles';
import { HeroSection } from './HeroSection';
import { WaitlistBar } from './WaitlistBar';
import { HowItWorksSection } from './HowItWorksSection';
import { InstagramTransformSection } from './InstagramTransformSection';
import { WhatsAppStorySection } from './WhatsAppStorySection';
import { CODSection } from './CODSection';
import { ShopPreviewSection } from './ShopPreviewSection';
import { BetaSignupSection } from './BetaSignupSection';
import { FooterSection } from './FooterSection';
import { StickyBottomCTA } from './StickyBottomCTA';

const BETA_TOTAL = 50;
const BETA_COUNT = 46;

export function BetaLanding() {
  const signupRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const signupSuccess = searchParams.get('signup') === 'success';
  const betaFull = searchParams.get('beta') === 'full';

  const scrollToSignup = () => {
    signupRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const spotsLeft = BETA_TOTAL - BETA_COUNT;

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white">
      <FloatingBubbles />

      <HeroSection onCtaClick={scrollToSignup} />

      <WaitlistBar count={BETA_COUNT} total={BETA_TOTAL} />

      <HowItWorksSection />

      <InstagramTransformSection />

      <WhatsAppStorySection />

      <CODSection />

      <ShopPreviewSection onSignup={scrollToSignup} />

      <BetaSignupSection
        ref={signupRef}
        count={BETA_COUNT}
        total={BETA_TOTAL}
        signupSuccess={signupSuccess}
        betaFull={betaFull}
      />

      <FooterSection />

      <StickyBottomCTA spotsLeft={spotsLeft} onCtaClick={scrollToSignup} />
    </div>
  );
}
