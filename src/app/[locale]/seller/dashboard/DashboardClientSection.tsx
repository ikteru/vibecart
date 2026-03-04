'use client';

import { Suspense } from 'react';
import type { SellerResponseDTO } from '@/application/dtos/SellerDTO';
import { WelcomeOverlay } from '@/presentation/components/seller/WelcomeOverlay';
import { WhatsAppPromptBanner } from '@/presentation/components/seller/WhatsAppPromptBanner';
import { ShareLinkCard } from '@/presentation/components/seller/ShareLinkCard';
import { OnboardingChecklist } from '@/presentation/components/seller/OnboardingChecklist';
import { DraftProductCards } from '@/presentation/components/seller/DraftProductCards';
import { updateWhatsAppNumber, publishDraftProduct, publishAllDrafts } from '../actions/dashboardActions';

interface DraftProduct {
  id: string;
  title: string;
  price: number;
  category: string;
  videoUrl: string;
}

interface DashboardClientSectionProps {
  seller: SellerResponseDTO;
  productCount: number;
  drafts: DraftProduct[];
}

/**
 * DashboardClientSection
 *
 * Client wrapper that renders the new onboarding components:
 * WelcomeOverlay, WhatsAppPromptBanner, ShareLinkCard, OnboardingChecklist, DraftProductCards.
 */
export function DashboardClientSection({ seller, productCount, drafts }: DashboardClientSectionProps) {
  const hasInstagram = seller.shopConfig.instagram?.isConnected || false;
  const showWhatsAppPrompt = !seller.whatsappNumber;

  const handleImportReels = async () => {
    const res = await fetch('/api/instagram/import-reels', { method: 'POST' });
    const data = await res.json();
    return data;
  };

  return (
    <>
      {/* Welcome Overlay - triggered by ?welcome=true */}
      <Suspense fallback={null}>
        <WelcomeOverlay handle={seller.handle} />
      </Suspense>

      {/* WhatsApp Prompt Banner */}
      {showWhatsAppPrompt && (
        <WhatsAppPromptBanner onSave={updateWhatsAppNumber} />
      )}

      {/* Share Link Card - prominent for new sellers */}
      <div className="mb-4">
        <ShareLinkCard handle={seller.handle} />
      </div>

      {/* Draft Product Cards */}
      {(drafts.length > 0 || hasInstagram) && (
        <div className="mb-4">
          <DraftProductCards
            drafts={drafts}
            onPublish={publishDraftProduct}
            onPublishAll={publishAllDrafts}
            onImportReels={handleImportReels}
            hasInstagram={hasInstagram}
          />
        </div>
      )}

      {/* Onboarding Checklist */}
      <div className="mb-4">
        <OnboardingChecklist seller={seller} productCount={productCount} />
      </div>
    </>
  );
}
