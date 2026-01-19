'use client';

import type { ChatPlatform } from '@/domain/entities/Seller';

interface PhoneMockupProps {
  platform: ChatPlatform;
  screenshotUrl: string;
  customerName: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Phone Mockup Component
 *
 * Displays a chat screenshot in an authentic phone frame
 * with platform-specific styling (WhatsApp/Instagram).
 */
export function PhoneMockup({
  platform,
  screenshotUrl,
  customerName,
  className = '',
  onClick,
}: PhoneMockupProps) {
  const isWhatsApp = platform === 'whatsapp';

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl border border-zinc-700 overflow-hidden ${
        onClick ? 'cursor-pointer hover:border-zinc-600 transition-colors' : ''
      } ${className}`}
      style={{
        backgroundColor: isWhatsApp ? '#0b141a' : '#000000',
      }}
    >
      {/* Phone Header */}
      <div
        className={`px-3 py-2 flex items-center gap-2 ${
          isWhatsApp
            ? 'bg-[#075e54]'
            : 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400'
        }`}
      >
        {/* Back Arrow */}
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>

        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
          {customerName.charAt(0).toUpperCase()}
        </div>

        {/* Name */}
        <span className="text-white text-xs font-medium truncate flex-1">
          {customerName}
        </span>

        {/* Platform Icon */}
        {isWhatsApp ? (
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" />
          </svg>
        )}
      </div>

      {/* Screenshot */}
      <div className="relative aspect-[9/16] overflow-hidden">
        <img
          src={screenshotUrl}
          alt={`Chat with ${customerName}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Phone Bottom Bar */}
      <div
        className={`px-3 py-2 ${
          isWhatsApp ? 'bg-[#0b141a]' : 'bg-black'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-zinc-800 rounded-full px-3 py-1.5">
            <span className="text-zinc-500 text-[10px]">
              {isWhatsApp ? 'Type a message' : 'Message...'}
            </span>
          </div>
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center ${
              isWhatsApp ? 'bg-[#075e54]' : 'bg-gradient-to-r from-purple-600 to-pink-500'
            }`}
          >
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
