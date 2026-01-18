/**
 * Preset WhatsApp Templates v2
 *
 * Ready-to-use templates with interactive buttons that sellers can activate with one tap.
 * Each template is written in a warm, Moroccan-friendly tone with Darija expressions
 * and available in Arabic, English, and French.
 */

import type { NotificationEventType } from '@/domain/entities/TemplateEventBinding';
import type { TemplateCategory, TemplateLanguage } from '@/domain/entities/WhatsAppMessageTemplate';

export interface PresetButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: {
    en: string;
    ar: string;
    fr: string;
  };
  payload?: string; // For QUICK_REPLY - what gets sent back
  url?: string; // For URL buttons
}

export interface PresetTemplate {
  id: string;
  name: string;
  targetEvent: NotificationEventType;
  category: TemplateCategory;
  description: {
    en: string;
    ar: string;
    fr: string;
  };
  body: {
    en: string;
    ar: string;
    fr: string;
  };
  buttons: PresetButton[];
  variablesUsed: string[];
}

/**
 * 10 Preset Templates with Interactive Buttons (2 per event type)
 *
 * Variables available:
 * {{1}} = customer_name
 * {{2}} = order_number
 * {{3}} = total_amount
 * {{4}} = tracking_number
 * {{5}} = shop_name
 * {{6}} = items_count
 */
export const PRESET_TEMPLATES: PresetTemplate[] = [
  // ============================================
  // ORDER_PENDING_CONFIRMATION (2 templates)
  // ============================================
  {
    id: 'order_pending_actions',
    name: 'order_pending_actions',
    targetEvent: 'ORDER_PENDING_CONFIRMATION',
    category: 'UTILITY',
    description: {
      en: 'Order confirmation with action buttons',
      ar: 'تأكيد الطلب مع أزرار التفاعل',
      fr: 'Confirmation de commande avec boutons',
    },
    body: {
      en: "Hey {{1}}! We got your order from {{5}}. Here's what you're getting: {{6}} items for {{3}}. Take a moment to check the details and let us know!",
      ar: 'اهلا {{1}}! وصلنا طلبك من {{5}}. عندك {{6}} منتجات بـ {{3}}. شوف التفاصيل و عطينا رأيك!',
      fr: "Salut {{1}}! On a bien recu ta commande de {{5}}. Tu as {{6}} articles pour {{3}}. Jette un coup d'oeil et dis-nous!",
    },
    buttons: [
      {
        type: 'QUICK_REPLY',
        text: { en: 'Confirm Order', ar: 'نأكد الطلب', fr: 'Confirmer' },
        payload: 'CONFIRM_ORDER',
      },
      {
        type: 'QUICK_REPLY',
        text: { en: 'Modify Order', ar: 'بغيت نعدل', fr: 'Modifier' },
        payload: 'MODIFY_ORDER',
      },
      {
        type: 'QUICK_REPLY',
        text: { en: 'Cancel', ar: 'الغاء', fr: 'Annuler' },
        payload: 'CANCEL_ORDER',
      },
    ],
    variablesUsed: ['customer_name', 'order_number', 'total_amount', 'shop_name', 'items_count'],
  },
  {
    id: 'order_pending_friendly',
    name: 'order_pending_friendly',
    targetEvent: 'ORDER_PENDING_CONFIRMATION',
    category: 'UTILITY',
    description: {
      en: 'Friendly order confirmation request',
      ar: 'طلب تأكيد ودي',
      fr: 'Demande de confirmation amicale',
    },
    body: {
      en: "{{1}}, your order {{2}} is waiting for you! Total: {{3}}. Just one tap and we'll start preparing everything.",
      ar: '{{1}}، طلبك {{2}} كيتسناك! المجموع: {{3}}. غير ضغطة وحدة وغادي نبداو نجهزو ليك كلشي.',
      fr: "{{1}}, ta commande {{2}} t'attend! Total: {{3}}. Un seul clic et on commence a tout preparer.",
    },
    buttons: [
      {
        type: 'QUICK_REPLY',
        text: { en: "Let's Go!", ar: 'يلاه نبداو', fr: "C'est parti!" },
        payload: 'CONFIRM_ORDER',
      },
      {
        type: 'QUICK_REPLY',
        text: { en: 'Need Changes', ar: 'بغيت نبدل شي حاجة', fr: 'Modifier' },
        payload: 'MODIFY_ORDER',
      },
      {
        type: 'QUICK_REPLY',
        text: { en: 'Not Now', ar: 'ماشي دابا', fr: 'Pas maintenant' },
        payload: 'CANCEL_ORDER',
      },
    ],
    variablesUsed: ['customer_name', 'order_number', 'total_amount'],
  },

  // ============================================
  // ORDER_CONFIRMED (2 templates)
  // ============================================
  {
    id: 'order_confirmed_celebrate',
    name: 'order_confirmed_celebrate',
    targetEvent: 'ORDER_CONFIRMED',
    category: 'UTILITY',
    description: {
      en: 'Celebratory confirmation message',
      ar: 'رسالة تأكيد احتفالية',
      fr: 'Message de confirmation festif',
    },
    body: {
      en: "Amazing {{1}}! Your order {{2}} is confirmed! We're packing {{6}} items with care. Total: {{3}}. You'll hear from us when it ships!",
      ar: 'واو {{1}}! تأكد طلبك {{2}}! كنجهزو ليك {{6}} منتجات بعناية. المجموع: {{3}}. غادي نعلموك ملي يتشحن!',
      fr: 'Super {{1}}! Ta commande {{2}} est confirmee! On prepare {{6}} articles avec soin. Total: {{3}}. On te tient au courant!',
    },
    buttons: [
      {
        type: 'QUICK_REPLY',
        text: { en: 'Track Status', ar: 'تتبع الطلب', fr: 'Suivre' },
        payload: 'TRACK_ORDER',
      },
      {
        type: 'QUICK_REPLY',
        text: { en: 'Contact Shop', ar: 'تواصل معانا', fr: 'Contacter' },
        payload: 'CONTACT_SHOP',
      },
    ],
    variablesUsed: ['customer_name', 'order_number', 'total_amount', 'items_count'],
  },
  {
    id: 'order_confirmed_warm',
    name: 'order_confirmed_warm',
    targetEvent: 'ORDER_CONFIRMED',
    category: 'UTILITY',
    description: {
      en: 'Warm thank you confirmation',
      ar: 'تأكيد مع شكر حار',
      fr: 'Confirmation avec remerciement chaleureux',
    },
    body: {
      en: 'Thank you {{1}}! Order {{2}} is now confirmed. We really appreciate you choosing {{5}}. Your {{6}} items are being prepared with love. Total: {{3}}',
      ar: 'شكرا بزاف {{1}}! الطلب {{2}} تأكد. كنشكروك على الثقة ديالك فـ {{5}}. كنجهزو ليك {{6}} منتجات بكل حب. المجموع: {{3}}',
      fr: "Merci {{1}}! Commande {{2}} confirmee. On apprecie vraiment que tu aies choisi {{5}}. Tes {{6}} articles sont prepares avec amour. Total: {{3}}",
    },
    buttons: [
      {
        type: 'QUICK_REPLY',
        text: { en: 'Thanks!', ar: 'شكرا!', fr: 'Merci!' },
        payload: 'THANKS',
      },
      {
        type: 'QUICK_REPLY',
        text: { en: 'Questions?', ar: 'عندي سؤال', fr: 'Question?' },
        payload: 'CONTACT_SHOP',
      },
    ],
    variablesUsed: ['customer_name', 'order_number', 'total_amount', 'shop_name', 'items_count'],
  },

  // ============================================
  // ORDER_SHIPPED (2 templates)
  // ============================================
  {
    id: 'order_shipped_track',
    name: 'order_shipped_track',
    targetEvent: 'ORDER_SHIPPED',
    category: 'UTILITY',
    description: {
      en: 'Shipping notification with tracking',
      ar: 'إشعار الشحن مع التتبع',
      fr: "Notification d'expedition avec suivi",
    },
    body: {
      en: "{{1}}, exciting news! Your order {{2}} just left our hands and is heading your way! Track it with: {{4}}. It's almost there!",
      ar: '{{1}}، خبر زوين! الطلب {{2}} خرج من عندنا وجاي ليك! تتبعو بهاد الرقم: {{4}}. قرب يوصل!',
      fr: "{{1}}, super nouvelle! Ta commande {{2}} vient de partir et arrive chez toi! Suis-la avec: {{4}}. C'est bientot la!",
    },
    buttons: [
      {
        type: 'QUICK_REPLY',
        text: { en: 'Track Package', ar: 'تتبع الطرد', fr: 'Suivre colis' },
        payload: 'TRACK_PACKAGE',
      },
      {
        type: 'QUICK_REPLY',
        text: { en: 'Report Issue', ar: 'عندي مشكل', fr: 'Signaler' },
        payload: 'REPORT_ISSUE',
      },
    ],
    variablesUsed: ['customer_name', 'order_number', 'tracking_number'],
  },
  {
    id: 'order_shipped_joy',
    name: 'order_shipped_joy',
    targetEvent: 'ORDER_SHIPPED',
    category: 'UTILITY',
    description: {
      en: 'Joyful shipping notification',
      ar: 'إشعار شحن مفرح',
      fr: "Notification d'expedition joyeuse",
    },
    body: {
      en: 'Your wait is almost over {{1}}! Order {{2}} is on its way to you. Keep an eye out for the delivery!',
      ar: 'قربات الفرحة {{1}}! الطلب {{2}} فالطريق ليك. خليك على أهبة الاستعداد للتوصيل!',
      fr: "L'attente est presque finie {{1}}! Commande {{2}} en route vers toi. Prepare-toi a la recevoir!",
    },
    buttons: [
      {
        type: 'QUICK_REPLY',
        text: { en: 'Great, thanks!', ar: 'زوين، شكرا!', fr: 'Super, merci!' },
        payload: 'THANKS',
      },
      {
        type: 'QUICK_REPLY',
        text: { en: 'When arrives?', ar: 'ايمتا يوصل؟', fr: 'Quand arrive?' },
        payload: 'DELIVERY_TIME',
      },
    ],
    variablesUsed: ['customer_name', 'order_number'],
  },

  // ============================================
  // ORDER_DELIVERED (2 templates)
  // ============================================
  {
    id: 'order_delivered_happy',
    name: 'order_delivered_happy',
    targetEvent: 'ORDER_DELIVERED',
    category: 'UTILITY',
    description: {
      en: 'Happy delivery confirmation',
      ar: 'تأكيد توصيل سعيد',
      fr: 'Confirmation de livraison joyeuse',
    },
    body: {
      en: '{{1}}, your order {{2}} has arrived! We hope it brings a smile to your face. Thank you for choosing {{5}} - you made our day!',
      ar: '{{1}}، وصل طلبك {{2}}! نتمناو يفرحك. شكرا على اختيارك {{5}} - فرحتينا!',
      fr: "{{1}}, ta commande {{2}} est arrivee! On espere qu'elle te fait plaisir. Merci d'avoir choisi {{5}} - tu nous fais plaisir!",
    },
    buttons: [
      {
        type: 'QUICK_REPLY',
        text: { en: 'Love it!', ar: 'عجبني بزاف!', fr: "J'adore!" },
        payload: 'POSITIVE_FEEDBACK',
      },
      {
        type: 'QUICK_REPLY',
        text: { en: 'Shop Again', ar: 'بغيت نشري مرة خرى', fr: 'Racheter' },
        payload: 'SHOP_AGAIN',
      },
      {
        type: 'QUICK_REPLY',
        text: { en: 'Need Help', ar: 'عندي مشكل', fr: 'Aide' },
        payload: 'NEED_HELP',
      },
    ],
    variablesUsed: ['customer_name', 'order_number', 'shop_name'],
  },
  {
    id: 'order_delivered_feedback',
    name: 'order_delivered_feedback',
    targetEvent: 'ORDER_DELIVERED',
    category: 'UTILITY',
    description: {
      en: 'Delivery with feedback request',
      ar: 'توصيل مع طلب رأي',
      fr: 'Livraison avec demande de feedback',
    },
    body: {
      en: 'Delivery complete {{1}}! Order {{2}} is now with you. How did we do? Your feedback helps us serve you better at {{5}}!',
      ar: 'توصل الطلب {{2}} يا {{1}}! كيفاش كانت التجربة؟ رأيك كيساعدنا نخدموك حسن فـ {{5}}!',
      fr: "Livraison terminee {{1}}! Commande {{2}} bien recue. Comment c'etait? Ton avis nous aide a mieux te servir chez {{5}}!",
    },
    buttons: [
      {
        type: 'QUICK_REPLY',
        text: { en: 'Excellent!', ar: 'ممتاز!', fr: 'Excellent!' },
        payload: 'FEEDBACK_EXCELLENT',
      },
      {
        type: 'QUICK_REPLY',
        text: { en: 'It was OK', ar: 'لا باس', fr: 'Correct' },
        payload: 'FEEDBACK_OK',
      },
      {
        type: 'QUICK_REPLY',
        text: { en: 'Had Issues', ar: 'كان مشكل', fr: 'Probleme' },
        payload: 'FEEDBACK_ISSUE',
      },
    ],
    variablesUsed: ['customer_name', 'order_number', 'shop_name'],
  },

  // ============================================
  // ORDER_CANCELLED (2 templates)
  // ============================================
  {
    id: 'order_cancelled_understand',
    name: 'order_cancelled_understand',
    targetEvent: 'ORDER_CANCELLED',
    category: 'UTILITY',
    description: {
      en: 'Understanding cancellation message',
      ar: 'رسالة إلغاء متفهمة',
      fr: "Message d'annulation comprehensif",
    },
    body: {
      en: "{{1}}, we understand - order {{2}} has been cancelled. No worries at all! We're here whenever you're ready at {{5}}.",
      ar: '{{1}}، فاهمين - الطلب {{2}} تلغى. ماشي مشكل! حنا هنا فـ {{5}} ملي تكون جاهز.',
      fr: "{{1}}, on comprend - commande {{2}} annulee. Pas de souci! On est la quand tu veux chez {{5}}.",
    },
    buttons: [
      {
        type: 'QUICK_REPLY',
        text: { en: 'Browse Again', ar: 'نتصفح من جديد', fr: 'Voir produits' },
        payload: 'BROWSE_PRODUCTS',
      },
      {
        type: 'QUICK_REPLY',
        text: { en: 'Contact Us', ar: 'نتواصل معاكم', fr: 'Contacter' },
        payload: 'CONTACT_SHOP',
      },
    ],
    variablesUsed: ['customer_name', 'order_number', 'shop_name'],
  },
  {
    id: 'order_cancelled_sorry',
    name: 'order_cancelled_sorry',
    targetEvent: 'ORDER_CANCELLED',
    category: 'UTILITY',
    description: {
      en: 'Apologetic cancellation message',
      ar: 'رسالة إلغاء مع اعتذار',
      fr: "Message d'annulation avec excuses",
    },
    body: {
      en: "{{1}}, we're sorry your order {{2}} didn't work out this time. We'd love another chance to serve you at {{5}}. See you soon!",
      ar: '{{1}}، كنتأسفو الطلب {{2}} ما مشاش هاد المرة. نتمناو نشوفوك قريب فـ {{5}}. مرحبا بيك ديما!',
      fr: "{{1}}, desole que la commande {{2}} n'ait pas marche cette fois. On espere te revoir bientot chez {{5}}. A tres vite!",
    },
    buttons: [
      {
        type: 'QUICK_REPLY',
        text: { en: 'Try Again', ar: 'نعاود نجرب', fr: 'Reessayer' },
        payload: 'TRY_AGAIN',
      },
      {
        type: 'QUICK_REPLY',
        text: { en: 'Maybe Later', ar: 'من بعد', fr: 'Plus tard' },
        payload: 'MAYBE_LATER',
      },
    ],
    variablesUsed: ['customer_name', 'order_number', 'shop_name'],
  },
];

/**
 * Get preset by ID
 */
export function getPresetById(id: string): PresetTemplate | undefined {
  return PRESET_TEMPLATES.find((p) => p.id === id);
}

/**
 * Get presets for a specific event type
 */
export function getPresetsForEvent(eventType: NotificationEventType): PresetTemplate[] {
  return PRESET_TEMPLATES.filter((p) => p.targetEvent === eventType);
}

/**
 * Get localized body text for a preset
 */
export function getPresetBody(preset: PresetTemplate, language: TemplateLanguage): string {
  return preset.body[language] || preset.body.en;
}

/**
 * Get localized description for a preset
 */
export function getPresetDescription(preset: PresetTemplate, language: TemplateLanguage): string {
  return preset.description[language] || preset.description.en;
}

/**
 * Get localized button text for a preset
 */
export function getPresetButtonText(
  button: PresetButton,
  language: TemplateLanguage
): string {
  return button.text[language] || button.text.en;
}

/**
 * Event type display info
 */
export const EVENT_DISPLAY_INFO: Record<NotificationEventType, { label: string; color: string }> = {
  ORDER_PENDING_CONFIRMATION: { label: 'Pending', color: 'yellow' },
  ORDER_CONFIRMED: { label: 'Confirmed', color: 'emerald' },
  ORDER_SHIPPED: { label: 'Shipped', color: 'blue' },
  ORDER_DELIVERED: { label: 'Delivered', color: 'green' },
  ORDER_CANCELLED: { label: 'Cancelled', color: 'red' },
};
