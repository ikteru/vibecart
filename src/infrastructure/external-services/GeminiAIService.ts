import { GoogleGenAI } from '@google/genai';
import type { CommandType, ParsedCommand } from './WhatsAppCommandParser';

/**
 * Gemini AI Service
 *
 * Provides AI-powered features:
 * - Natural language command parsing
 * - Sales pitch generation
 * - Product description generation
 */
export class GeminiAIService {
  private client: GoogleGenAI | null = null;
  private model = 'gemini-2.0-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Parse a natural language message into a command
   */
  async parseCommand(message: string): Promise<Omit<ParsedCommand, 'originalMessage'>> {
    if (!this.client) {
      return {
        isCommand: false,
        command: null,
        args: {},
        confidence: 0,
      };
    }

    const prompt = `You are a WhatsApp order management assistant. Analyze the following message and determine if it's a command to manage an order.

Available commands:
- confirm: Confirm/approve an order
- cancel: Cancel an order
- status: Check order status
- track: Get tracking information
- help: Show available commands
- reorder: Reorder previous items

Message: "${message}"

Respond in JSON format only:
{
  "isCommand": true/false,
  "command": "confirm"|"cancel"|"status"|"track"|"help"|"reorder"|null,
  "orderNumber": "extracted order number or null",
  "confidence": 0.0-1.0
}

Consider these cases:
- "yes" or "ok" after order details = confirm
- "cancel my order" or "I don't want it anymore" = cancel
- "where is my order" or "when will it arrive" = status/track
- Arabic/Darija like "واخا" (ok), "الغي" (cancel), "فين الطلب" (where is order) = detect language and command
- French like "annuler ma commande" = cancel

Only return the JSON, nothing else.`;

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const text = response.text?.trim() || '';

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          isCommand: false,
          command: null,
          args: {},
          confidence: 0,
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        isCommand: parsed.isCommand === true,
        command: parsed.command as CommandType | null,
        args: parsed.orderNumber ? { orderNumber: parsed.orderNumber } : {},
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      };
    } catch (error) {
      console.error('Gemini parseCommand error:', error);
      return {
        isCommand: false,
        command: null,
        args: {},
        confidence: 0,
      };
    }
  }

  /**
   * Generate a sales pitch for a product
   */
  async generateSalesPitch(product: {
    title: string;
    description?: string;
    price: number;
    category: string;
  }, language: 'ar-MA' | 'ar' | 'fr' | 'en' = 'ar-MA'): Promise<string> {
    if (!this.client) {
      return product.description || product.title;
    }

    const languageInstructions = {
      'ar-MA': 'Write in Moroccan Darija (Arabic script). Use casual, friendly tone with expressions like "زوين", "واو", "خطير".',
      'ar': 'Write in Modern Standard Arabic. Use professional but warm tone.',
      'fr': 'Write in French. Use engaging, persuasive marketing language.',
      'en': 'Write in English. Use compelling, conversational marketing copy.',
    };

    const prompt = `Generate a short, compelling sales pitch for this product for WhatsApp/Instagram:

Product: ${product.title}
Category: ${product.category}
Price: ${product.price} MAD
${product.description ? `Description: ${product.description}` : ''}

${languageInstructions[language]}

Requirements:
- Maximum 3 short sentences
- Include emoji
- Create urgency
- Highlight value
- Perfect for social media

Return only the pitch text, nothing else.`;

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      return response.text?.trim() || product.title;
    } catch (error) {
      console.error('Gemini generateSalesPitch error:', error);
      return product.description || product.title;
    }
  }

  /**
   * Generate a command response message
   */
  async generateCommandResponse(
    command: CommandType,
    success: boolean,
    context: {
      orderNumber?: string;
      customerName?: string;
      orderStatus?: string;
      trackingNumber?: string;
      error?: string;
    },
    language: 'ar-MA' | 'ar' | 'fr' | 'en' = 'ar-MA'
  ): Promise<string> {
    // Use pre-defined templates for common responses (faster than AI)
    const templates = this.getResponseTemplates(language);

    if (command === 'help') {
      return templates.help;
    }

    if (!success && context.error) {
      return templates.error.replace('{error}', context.error);
    }

    switch (command) {
      case 'confirm':
        return success
          ? templates.confirmSuccess.replace('{orderNumber}', context.orderNumber || '')
          : templates.confirmError;

      case 'cancel':
        return success
          ? templates.cancelSuccess.replace('{orderNumber}', context.orderNumber || '')
          : templates.cancelError;

      case 'status':
        return success
          ? templates.statusSuccess
              .replace('{orderNumber}', context.orderNumber || '')
              .replace('{status}', context.orderStatus || '')
          : templates.statusError;

      case 'track':
        return success
          ? templates.trackSuccess
              .replace('{orderNumber}', context.orderNumber || '')
              .replace('{tracking}', context.trackingNumber || '')
          : templates.trackError;

      case 'reorder':
        return success
          ? templates.reorderSuccess.replace('{orderNumber}', context.orderNumber || '')
          : templates.reorderError;

      default:
        return templates.unknown;
    }
  }

  private getResponseTemplates(language: 'ar-MA' | 'ar' | 'fr' | 'en') {
    const templates = {
      'ar-MA': {
        help: `🤖 الأوامر المتاحة:
/confirm [رقم_الطلب] - تأكيد الطلب
/cancel [رقم_الطلب] - إلغاء الطلب
/status [رقم_الطلب] - حالة الطلب
/track [رقم_الطلب] - تتبع الطلب
/reorder [رقم_الطلب] - إعادة الطلب`,
        confirmSuccess: '✅ الطلب {orderNumber} تأكد! غادي نحضروه دابا.',
        confirmError: '❌ ما قدرناش نأكدو الطلب. عاود حاول.',
        cancelSuccess: '🚫 الطلب {orderNumber} تلغى.',
        cancelError: '❌ ما قدرناش نلغيو الطلب.',
        statusSuccess: '📦 الطلب {orderNumber}: {status}',
        statusError: '❌ ما لقيناش هاد الطلب.',
        trackSuccess: '🚚 الطلب {orderNumber}\nرقم التتبع: {tracking}',
        trackError: '❌ ما كاينش رقم التتبع حاليا.',
        reorderSuccess: '🔄 غادي نرجعو الطلب {orderNumber}.',
        reorderError: '❌ ما قدرناش نرجعو الطلب.',
        error: '❌ {error}',
        unknown: '❓ ما فهمتش. كتب /help باش تشوف الأوامر.',
      },
      'ar': {
        help: `🤖 الأوامر المتاحة:
/confirm [رقم_الطلب] - تأكيد الطلب
/cancel [رقم_الطلب] - إلغاء الطلب
/status [رقم_الطلب] - حالة الطلب
/track [رقم_الطلب] - تتبع الطلب
/reorder [رقم_الطلب] - إعادة الطلب`,
        confirmSuccess: '✅ تم تأكيد الطلب {orderNumber}! سنقوم بتحضيره الآن.',
        confirmError: '❌ تعذر تأكيد الطلب. يرجى المحاولة مرة أخرى.',
        cancelSuccess: '🚫 تم إلغاء الطلب {orderNumber}.',
        cancelError: '❌ تعذر إلغاء الطلب.',
        statusSuccess: '📦 الطلب {orderNumber}: {status}',
        statusError: '❌ لم نجد هذا الطلب.',
        trackSuccess: '🚚 الطلب {orderNumber}\nرقم التتبع: {tracking}',
        trackError: '❌ لا يوجد رقم تتبع حالياً.',
        reorderSuccess: '🔄 سنعيد الطلب {orderNumber}.',
        reorderError: '❌ تعذر إعادة الطلب.',
        error: '❌ {error}',
        unknown: '❓ لم أفهم. اكتب /help لعرض الأوامر.',
      },
      'fr': {
        help: `🤖 Commandes disponibles:
/confirm [numéro] - Confirmer la commande
/cancel [numéro] - Annuler la commande
/status [numéro] - État de la commande
/track [numéro] - Suivre la commande
/reorder [numéro] - Recommander`,
        confirmSuccess: '✅ Commande {orderNumber} confirmée! Nous la préparons.',
        confirmError: '❌ Impossible de confirmer. Réessayez.',
        cancelSuccess: '🚫 Commande {orderNumber} annulée.',
        cancelError: '❌ Impossible d\'annuler la commande.',
        statusSuccess: '📦 Commande {orderNumber}: {status}',
        statusError: '❌ Commande introuvable.',
        trackSuccess: '🚚 Commande {orderNumber}\nSuivi: {tracking}',
        trackError: '❌ Pas de numéro de suivi disponible.',
        reorderSuccess: '🔄 Recommande {orderNumber} en cours.',
        reorderError: '❌ Impossible de recommander.',
        error: '❌ {error}',
        unknown: '❓ Je n\'ai pas compris. Tapez /help pour les commandes.',
      },
      'en': {
        help: `🤖 Available commands:
/confirm [order_number] - Confirm order
/cancel [order_number] - Cancel order
/status [order_number] - Check status
/track [order_number] - Track order
/reorder [order_number] - Reorder`,
        confirmSuccess: '✅ Order {orderNumber} confirmed! We\'re preparing it now.',
        confirmError: '❌ Couldn\'t confirm order. Please try again.',
        cancelSuccess: '🚫 Order {orderNumber} cancelled.',
        cancelError: '❌ Couldn\'t cancel order.',
        statusSuccess: '📦 Order {orderNumber}: {status}',
        statusError: '❌ Order not found.',
        trackSuccess: '🚚 Order {orderNumber}\nTracking: {tracking}',
        trackError: '❌ No tracking number available yet.',
        reorderSuccess: '🔄 Reordering {orderNumber}.',
        reorderError: '❌ Couldn\'t reorder.',
        error: '❌ {error}',
        unknown: '❓ I didn\'t understand. Type /help for commands.',
      },
    };

    return templates[language];
  }
}
