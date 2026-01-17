import { getCurrentSeller } from '@/lib/auth/getCurrentSeller';
import { createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { GetSellerProducts } from '@/application/use-cases/products/GetSellerProducts';
import { UpdateProduct } from '@/application/use-cases/products/UpdateProduct';
import { InventoryList } from '@/presentation/components/seller/InventoryList';

interface InventoryPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Seller Inventory Page
 *
 * Server component that fetches real products from the database.
 * Passes products to the client component for stock management.
 */
export default async function InventoryPage({ params }: InventoryPageProps) {
  const { locale } = await params;

  // Get authenticated seller
  const seller = await getCurrentSeller(locale);

  // Fetch products from database
  const supabase = await createClient();
  const { productRepository } = createRepositories(supabase);

  const getProductsUseCase = new GetSellerProducts(productRepository);
  const result = await getProductsUseCase.execute({
    sellerId: seller.id,
    limit: 100,
  });

  // Capture seller ID for server action
  const sellerId = seller.id;

  // Server action for updating stock
  async function updateStock(productId: string, newStock: number) {
    'use server';

    const supabaseServer = await createClient();
    const repos = createRepositories(supabaseServer);

    const updateUseCase = new UpdateProduct(repos.productRepository);
    const updateResult = await updateUseCase.execute({
      productId,
      sellerId,
      updates: { stock: newStock },
    });

    if (!updateResult.success) {
      return { success: false, error: updateResult.error || 'Failed to update stock' };
    }

    return { success: true };
  }

  return (
    <InventoryList
      initialProducts={result.products}
      locale={locale}
      updateStockAction={updateStock}
    />
  );
}
