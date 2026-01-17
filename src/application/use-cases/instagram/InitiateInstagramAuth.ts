/**
 * Initiate Instagram Auth Use Case
 *
 * Generates the Instagram authorization URL with CSRF protection.
 */

import { InstagramGraphService } from '@/infrastructure/external-services/InstagramGraphService';
import { randomBytes } from 'crypto';

interface InitiateInstagramAuthInput {
  sellerId: string;
}

interface InitiateInstagramAuthOutput {
  authorizationUrl: string;
  state: string; // Must be stored in cookie/session for validation
}

export class InitiateInstagramAuth {
  private instagramService: InstagramGraphService;

  constructor() {
    this.instagramService = new InstagramGraphService();
  }

  async execute(input: InitiateInstagramAuthInput): Promise<InitiateInstagramAuthOutput> {
    // Generate secure state token for CSRF protection
    // Include sellerId to verify on callback
    const stateData = {
      sellerId: input.sellerId,
      nonce: randomBytes(16).toString('hex'),
      timestamp: Date.now(),
    };

    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');

    const authorizationUrl = this.instagramService.getAuthorizationUrl(state);

    return {
      authorizationUrl,
      state,
    };
  }
}
