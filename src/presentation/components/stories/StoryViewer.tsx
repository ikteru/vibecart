'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { StoryContent } from './StoryContent';
import type { StoryGroup } from '@/presentation/types/Story';

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
  onViewed: (groupId: string) => void;
}

const STORY_DURATION = 5000; // 5 seconds for images

/**
 * StoryViewer - Full-screen Instagram-style story viewer with progress bars,
 * tap to navigate, and auto-advance.
 */
export function StoryViewer({
  groups,
  initialGroupIndex,
  onClose,
  onViewed,
}: StoryViewerProps) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  const currentGroup = groups[groupIndex];
  const currentItem = currentGroup?.items[itemIndex];

  // Mark group as viewed when entering it
  useEffect(() => {
    if (currentGroup) {
      onViewed(currentGroup.id);
    }
  }, [groupIndex, currentGroup, onViewed]);

  // Auto-advance timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    setProgress(0);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min(elapsed / STORY_DURATION, 1);
      setProgress(p);

      if (p >= 1) {
        goNext();
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [groupIndex, itemIndex]);

  const goNext = useCallback(() => {
    if (!currentGroup) return;

    if (itemIndex < currentGroup.items.length - 1) {
      // Next item in same group
      setItemIndex((prev) => prev + 1);
    } else if (groupIndex < groups.length - 1) {
      // Next group
      setGroupIndex((prev) => prev + 1);
      setItemIndex(0);
    } else {
      // End of all stories
      onClose();
    }
  }, [currentGroup, itemIndex, groupIndex, groups.length, onClose]);

  const goPrev = useCallback(() => {
    if (itemIndex > 0) {
      setItemIndex((prev) => prev - 1);
    } else if (groupIndex > 0) {
      setGroupIndex((prev) => prev - 1);
      const prevGroup = groups[groupIndex - 1];
      setItemIndex(prevGroup.items.length - 1);
    }
  }, [itemIndex, groupIndex, groups]);

  // Tap handler: left 30% = prev, right 70% = next
  const handleTap = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const threshold = rect.width * 0.3;

      if (x < threshold) {
        goPrev();
      } else {
        goNext();
      }
    },
    [goPrev, goNext]
  );

  if (!currentGroup || !currentItem) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Progress bars */}
      <div className="absolute top-0 inset-x-0 z-20 flex gap-1 px-2 pt-2 safe-area-top">
        {currentGroup.items.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{
                width:
                  i < itemIndex
                    ? '100%'
                    : i === itemIndex
                    ? `${progress * 100}%`
                    : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-10 end-4 z-20 p-2 bg-black/40 backdrop-blur-md rounded-full text-white"
      >
        <X size={20} />
      </button>

      {/* Tap zones */}
      <div className="absolute inset-0 z-10" onClick={handleTap} />

      {/* Story content */}
      <div className="w-full h-full">
        <StoryContent item={currentItem} />
      </div>
    </div>
  );
}
