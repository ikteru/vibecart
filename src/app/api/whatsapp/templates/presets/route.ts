import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient, createAdminClient, getCurrentUser } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { CreateTemplate } from '@/application/use-cases/whatsapp-templates';
import { getPresetById, getPresetBody } from '@/application/data/presetTemplates';
import type { TemplateLanguage, TemplateComponent, TemplateButton } from '@/domain/entities/WhatsAppMessageTemplate';

/**
 * POST /api/whatsapp/templates/presets
 *
 * Create a template from a preset, including interactive buttons.
 *
 * Body: { presetId: string, language: TemplateLanguage }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { presetId, language } = body as {
      presetId: string;
      language: TemplateLanguage;
    };

    if (!presetId) {
      return NextResponse.json({ error: 'Preset ID is required' }, { status: 400 });
    }

    // Get the preset
    const preset = getPresetById(presetId);
    if (!preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    // Get seller
    const supabase = await createClient();
    const { sellerRepository } = createRepositories(supabase);

    const seller = await sellerRepository.findByUserId(user.id);
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    // Get the localized body text
    const templateLanguage: TemplateLanguage = language || 'ar';
    const bodyText = getPresetBody(preset, templateLanguage);

    // Build components array with BODY and optional BUTTONS
    const components: TemplateComponent[] = [
      {
        type: 'BODY',
        text: bodyText,
      },
    ];

    // Add BUTTONS component if preset has buttons
    if (preset.buttons && preset.buttons.length > 0) {
      const buttons: TemplateButton[] = preset.buttons.map((btn) => ({
        type: btn.type,
        text: btn.text[templateLanguage] || btn.text.en,
        // Include URL if it's a URL button
        ...(btn.url && { url: btn.url }),
      }));

      components.push({
        type: 'BUTTONS',
        buttons,
      });
    }

    // Create the template
    const adminClient = createAdminClient();
    const { whatsAppTemplateRepository } = createRepositories(adminClient);

    const useCase = new CreateTemplate(whatsAppTemplateRepository);
    const result = await useCase.execute({
      sellerId: seller.id,
      templateName: preset.name,
      templateLanguage,
      category: preset.category,
      description: preset.description[templateLanguage] || preset.description.en,
      components,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.template, { status: 201 });
  } catch (error) {
    console.error('POST /api/whatsapp/templates/presets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/whatsapp/templates/presets
 *
 * List all available presets.
 */
export async function GET() {
  try {
    const { PRESET_TEMPLATES } = await import('@/application/data/presetTemplates');
    return NextResponse.json({ presets: PRESET_TEMPLATES });
  } catch (error) {
    console.error('GET /api/whatsapp/templates/presets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
