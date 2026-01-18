/**
 * Initiate WhatsApp Auth Use Case
 *
 * Generates the Facebook OAuth authorization URL for WhatsApp Business
 * with CSRF protection.
 */

import { WhatsAppCloudApiService } from '@/infrastructure/external-services/WhatsAppCloudApiService';
import { randomBytes } from 'crypto';

interface InitiateWhatsAppAuthInput {
  sellerId: string;
}

interface InitiateWhatsAppAuthOutput {
  authorizationUrl: string;
  state: string; // Must be stored in cookie/session for validation
}

export class InitiateWhatsAppAuth {
  private whatsAppService: WhatsAppCloudApiService;

  constructor() {
    this.whatsAppService = new WhatsAppCloudApiService();
  }

  async execute(input: InitiateWhatsAppAuthInput): Promise<InitiateWhatsAppAuthOutput> {
    // Generate secure state token for CSRF protection
    // Include sellerId to verify on callback
    const stateData = {
      sellerId: input.sellerId,
      nonce: randomBytes(16).toString('hex'),
      timestamp: Date.now(),
    };

    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');

    const authorizationUrl = this.whatsAppService.getAuthorizationUrl(state);

    return {
      authorizationUrl,
      state,
    };
  }
}
