'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { ChatReview } from '@/domain/entities/Seller';
import { PhoneMockup } from '../seller/vibe/PhoneMockup';

interface ChatReviewDisplayProps {
  review: ChatReview;
}

/**
 * Chat Review Display Component
 *
 * Public display of chat screenshots in the shop grid.
 * Tapping opens a fullscreen modal view.
 */
export function ChatReviewDisplay({ review }: ChatReviewDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Card Preview */}
      <div className="w-full">
        <PhoneMockup
          platform={review.platform}
          screenshotUrl={review.screenshotUrl}
          customerName={review.customerName || 'Customer'}
          onClick={() => setIsExpanded(true)}
          className="w-full"
        />
      </div>

      {/* Fullscreen Modal */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsExpanded(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute top-4 end-4 p-2 text-white/70 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* Fullscreen Phone */}
          <div
            className="max-w-sm w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <PhoneMockup
              platform={review.platform}
              screenshotUrl={review.screenshotUrl}
              customerName={review.customerName || 'Customer'}
              className="w-full"
            />
          </div>
        </div>
      )}
    </>
  );
}
