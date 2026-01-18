'use client';

import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

interface TemplatePreviewProps {
  headerText?: string;
  bodyText: string;
  footerText?: string;
}

/**
 * WhatsApp-style Template Preview
 *
 * Renders template content as it would appear in WhatsApp.
 */
export function TemplatePreview({ headerText, bodyText, footerText }: TemplatePreviewProps) {
  // Replace variables with example values for preview
  const exampleValues: Record<string, string> = {
    '1': 'Ahmed',
    '2': 'ORD-A1B2',
    '3': '450 MAD',
    '4': 'MA123456',
    '5': 'Zara Shop',
    '6': '3',
  };

  const replaceVariables = (text: string): string => {
    return text.replace(/\{\{(\d+)\}\}/g, (_, num) => {
      return exampleValues[num] || `{{${num}}}`;
    });
  };

  const formattedBody = replaceVariables(bodyText || '');
  const formattedHeader = headerText ? replaceVariables(headerText) : '';
  const formattedFooter = footerText ? replaceVariables(footerText) : '';

  return (
    <div className="bg-[#0b141a] rounded-xl p-4 min-h-[300px]">
      {/* WhatsApp Chat Header */}
      <div className="flex items-center gap-3 pb-3 mb-3 border-b border-zinc-800">
        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
          C
        </div>
        <div>
          <div className="text-white text-sm font-medium">Customer</div>
          <div className="text-zinc-500 text-xs">online</div>
        </div>
      </div>

      {/* Message Bubble */}
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-[#005c4b] rounded-lg rounded-tr-none p-3 shadow-sm">
          {/* Header */}
          {formattedHeader && (
            <div className="font-bold text-white text-sm mb-2">
              {formattedHeader}
            </div>
          )}

          {/* Body */}
          <div className="text-white text-sm whitespace-pre-wrap">
            {formattedBody || (
              <span className="text-zinc-400 italic">Enter body text...</span>
            )}
          </div>

          {/* Footer */}
          {formattedFooter && (
            <div className="text-zinc-400 text-xs mt-2 pt-2 border-t border-zinc-600">
              {formattedFooter}
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] text-zinc-400">12:34 PM</span>
            <CheckCheck size={14} className="text-blue-400" />
          </div>
        </div>
      </div>

      {/* Example values legend */}
      <div className="mt-4 pt-3 border-t border-zinc-800">
        <div className="text-[10px] text-zinc-600 mb-2">Preview uses example values:</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(exampleValues).slice(0, 4).map(([num, val]) => (
            <span key={num} className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded">
              <span className="text-emerald-400">{`{{${num}}}`}</span>
              <span className="text-zinc-500 mx-1">=</span>
              <span className="text-zinc-300">{val}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
