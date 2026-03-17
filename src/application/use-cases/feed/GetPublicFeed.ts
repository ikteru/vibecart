/**
 * GetPublicFeed Use Case
 *
 * Fetches paginated products across all sellers for the public discovery feed.
 */

import type { FeedRepository } from '@/domain/repositories/FeedRepository';
import type { FeedQueryDTO, FeedResponseDTO } from '@/application/dtos/FeedDTO';
import { FeedMapper } from '@/application/mappers/FeedMapper';

export class GetPublicFeed {
  constructor(private feedRepository: FeedRepository) {}

  async execute(input: FeedQueryDTO): Promise<FeedResponseDTO> {
    const { limit = 10, cursor } = input;

    const result = await this.feedRepository.findPublicFeed({ limit, cursor });

    return {
      products: FeedMapper.toDTOList(result.products),
      nextCursor: result.nextCursor,
    };
  }
}
