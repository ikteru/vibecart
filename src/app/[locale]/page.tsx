import { Suspense } from 'react';
import { BetaLanding } from '@/presentation/components/landing/BetaLanding';

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <BetaLanding />
    </Suspense>
  );
}
