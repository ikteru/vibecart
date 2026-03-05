import { z } from 'zod';

export const BetaSignupSchema = z.object({
  instagramHandle: z
    .string()
    .min(1, 'Instagram handle is required')
    .transform((val) => val.replace(/^@/, '').trim().toLowerCase()),
  whatsappNumber: z
    .string()
    .min(1, 'WhatsApp number is required')
    .regex(
      /^(0|\+212|212)[567]\d{8}$/,
      'Invalid Moroccan phone number'
    ),
  city: z.string().optional(),
  category: z.string().optional(),
});

export type BetaSignupDTO = z.infer<typeof BetaSignupSchema>;

export interface BetaSignupResponseDTO {
  success: boolean;
  queuePosition?: number;
  error?: string;
}
