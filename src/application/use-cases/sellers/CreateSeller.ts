import { Seller } from '@/domain/entities/Seller';
import { SellerRepository } from '@/domain/repositories/SellerRepository';
import { SellerMapper } from '@/application/mappers/SellerMapper';
import type { CreateSellerDTO, SellerResponseDTO } from '@/application/dtos/SellerDTO';

/**
 * CreateSeller Use Case Output
 */
export interface CreateSellerOutput {
  success: boolean;
  seller?: SellerResponseDTO;
  error?: string;
}

/**
 * CreateSeller Use Case
 *
 * Creates a new seller account after user registration.
 */
export class CreateSeller {
  constructor(private sellerRepository: SellerRepository) {}

  async execute(
    input: CreateSellerDTO,
    locale: string = 'ar-MA'
  ): Promise<CreateSellerOutput> {
    try {
      // Check if user already has a seller account
      const existingSeller = await this.sellerRepository.findByUserId(input.userId);
      if (existingSeller) {
        return {
          success: false,
          error: 'User already has a seller account',
        };
      }

      // Check if handle is available
      const handleAvailable = await this.sellerRepository.isHandleAvailable(
        input.handle
      );
      if (!handleAvailable) {
        return {
          success: false,
          error: 'Handle is already taken',
        };
      }

      // Create domain entity (validation happens here)
      const seller = Seller.create({
        userId: input.userId,
        shopName: input.shopName,
        handle: input.handle,
        whatsappNumber: input.whatsappNumber,
        shopConfig: input.shopConfig,
      });

      // Save to repository
      await this.sellerRepository.save(seller);

      return {
        success: true,
        seller: SellerMapper.toDTO(seller, locale),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create seller',
      };
    }
  }
}
