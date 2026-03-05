import type { SupabaseClient } from '@supabase/supabase-js';

export interface BetaSignup {
  id: string;
  instagramHandle: string;
  whatsappNumber: string;
  city?: string;
  category?: string;
  queuePosition: number;
  createdAt: Date;
}

export interface CreateBetaSignupInput {
  instagramHandle: string;
  whatsappNumber: string;
  city?: string;
  category?: string;
}

export class SupabaseBetaSignupRepository {
  constructor(private supabase: SupabaseClient) {}

  async getCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('beta_signups')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Failed to get beta signup count:', error);
      return 0;
    }

    return count || 0;
  }

  async existsByInstagramHandle(handle: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('beta_signups')
      .select('id')
      .eq('instagram_handle', handle.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to check duplicate:', error);
    }

    return !!data;
  }

  async create(input: CreateBetaSignupInput): Promise<BetaSignup> {
    // Get current count for queue position
    const currentCount = await this.getCount();
    const queuePosition = currentCount + 1;

    const { data, error } = await this.supabase
      .from('beta_signups')
      .insert({
        instagram_handle: input.instagramHandle.toLowerCase(),
        whatsapp_number: input.whatsappNumber,
        city: input.city || null,
        category: input.category || null,
        queue_position: queuePosition,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('DUPLICATE');
      }
      throw new Error(`Failed to create beta signup: ${error.message}`);
    }

    return {
      id: data.id,
      instagramHandle: data.instagram_handle,
      whatsappNumber: data.whatsapp_number,
      city: data.city,
      category: data.category,
      queuePosition: data.queue_position,
      createdAt: new Date(data.created_at),
    };
  }
}
