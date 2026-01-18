import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { getCurrentUser } from '@/infrastructure/auth/supabase-server';
import { PRESET_TEMPLATES, EVENT_DISPLAY_INFO } from '@/application/data/presetTemplates';
import { PresetTemplateCard } from '@/presentation/components/seller/templates/PresetTemplateCard';
import type { TemplateLanguage } from '@/domain/entities/WhatsAppMessageTemplate';

interface PresetsPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Preset Templates Page
 *
 * Displays 10 ready-to-use templates that sellers can activate with one tap.
 */
export default async function PresetsPage({ params }: PresetsPageProps) {
  const { locale } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Map locale to template language
  const languageMap: Record<string, TemplateLanguage> = {
    ar: 'ar',
    'ar-MA': 'ar',
    en: 'en',
    fr: 'fr',
  };
  const templateLanguage: TemplateLanguage = languageMap[locale] || 'ar';

  // Group presets by event type
  const presetsByEvent = PRESET_TEMPLATES.reduce(
    (acc, preset) => {
      if (!acc[preset.targetEvent]) {
        acc[preset.targetEvent] = [];
      }
      acc[preset.targetEvent].push(preset);
      return acc;
    },
    {} as Record<string, typeof PRESET_TEMPLATES>
  );

  const eventOrder = [
    'ORDER_PENDING_CONFIRMATION',
    'ORDER_CONFIRMED',
    'ORDER_SHIPPED',
    'ORDER_DELIVERED',
    'ORDER_CANCELLED',
  ] as const;

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/${locale}/seller/templates`}
          className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-400" />
            Preset Templates
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Ready-to-use templates for every order event
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-800/50 rounded-xl">
        <div className="text-yellow-400 text-sm font-medium mb-1">
          Quick Start Templates
        </div>
        <p className="text-yellow-300/70 text-xs">
          These templates are optimized for Meta approval. Tap &quot;Use This Template&quot; to
          create a draft, then submit to Meta for approval.
        </p>
      </div>

      {/* Templates by Event */}
      <div className="space-y-8">
        {eventOrder.map((eventType) => {
          const presets = presetsByEvent[eventType] || [];
          const eventInfo = EVENT_DISPLAY_INFO[eventType];

          return (
            <div key={eventType}>
              <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    eventInfo.color === 'yellow'
                      ? 'bg-yellow-400'
                      : eventInfo.color === 'emerald'
                      ? 'bg-emerald-400'
                      : eventInfo.color === 'blue'
                      ? 'bg-blue-400'
                      : eventInfo.color === 'green'
                      ? 'bg-green-400'
                      : 'bg-red-400'
                  }`}
                />
                {eventInfo.label}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {presets.map((preset) => (
                  <PresetTemplateCard
                    key={preset.id}
                    preset={preset}
                    language={templateLanguage}
                    locale={locale}
                    eventInfo={eventInfo}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
