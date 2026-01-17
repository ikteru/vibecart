import { Seller } from '@/domain/entities/Seller';
import { SellerRepository } from '@/domain/repositories/SellerRepository';

/**
 * MockSellerRepository
 *
 * In-memory implementation of SellerRepository for testing.
 */
export class MockSellerRepository implements SellerRepository {
  private sellers: Map<string, Seller> = new Map();

  async findById(id: string): Promise<Seller | null> {
    return this.sellers.get(id) || null;
  }

  async findByHandle(handle: string): Promise<Seller | null> {
    const normalizedHandle = handle.toLowerCase();
    const sellers = Array.from(this.sellers.values());
    for (const seller of sellers) {
      if (seller.handle === normalizedHandle) {
        return seller;
      }
    }
    return null;
  }

  async findByUserId(userId: string): Promise<Seller | null> {
    const sellers = Array.from(this.sellers.values());
    for (const seller of sellers) {
      if (seller.userId === userId) {
        return seller;
      }
    }
    return null;
  }

  async isHandleAvailable(
    handle: string,
    excludeSellerId?: string
  ): Promise<boolean> {
    const normalizedHandle = handle.toLowerCase();
    const sellers = Array.from(this.sellers.values());
    for (const seller of sellers) {
      if (seller.handle === normalizedHandle) {
        if (excludeSellerId && seller.id === excludeSellerId) {
          continue;
        }
        return false;
      }
    }
    return true;
  }

  async save(seller: Seller): Promise<void> {
    this.sellers.set(seller.id, seller);
  }

  async delete(id: string): Promise<void> {
    this.sellers.delete(id);
  }

  // Test helpers
  clear(): void {
    this.sellers.clear();
  }

  seedWith(sellers: Seller[]): void {
    for (const seller of sellers) {
      this.sellers.set(seller.id, seller);
    }
  }
}
