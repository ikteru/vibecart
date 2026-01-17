import { notFound } from 'next/navigation';
import { createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { GetSellerByHandle } from '@/application/use-cases/sellers';
import { GetSellerProducts } from '@/application/use-cases/products';
import { ShopPageClient } from './ShopPageClient';

interface ShopPageProps {
  params: Promise<{
    locale: string;
    handle: string;
  }>;
}

/**
 * Shop Page (Server Component)
 *
 * Fetches seller and product data from the database.
 * Passes data to client component for interactivity.
 */
export default async function ShopPage({ params }: ShopPageProps) {
  const { locale, handle } = await params;

  const supabase = await createClient();
  const { sellerRepository, productRepository } = createRepositories(supabase);

  // Fetch seller by handle
  const getSellerUseCase = new GetSellerByHandle(sellerRepository);
  const sellerResult = await getSellerUseCase.execute({ handle, locale });

  if (!sellerResult.seller) {
    notFound();
  }

  // Fetch active products for this seller
  const getProductsUseCase = new GetSellerProducts(productRepository);
  const productsResult = await getProductsUseCase.execute({
    sellerId: sellerResult.seller.id,
    isActive: true,
  });

  return (
    <ShopPageClient
      seller={sellerResult.seller}
      products={productsResult.products}
    />
  );
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: ShopPageProps) {
  const { handle } = await params;

  const supabase = await createClient();
  const { sellerRepository } = createRepositories(supabase);

  const getSellerUseCase = new GetSellerByHandle(sellerRepository);
  const sellerResult = await getSellerUseCase.execute({ handle });

  if (!sellerResult.seller) {
    return {
      title: 'Shop Not Found',
    };
  }

  return {
    title: `${sellerResult.seller.shopName} | VibeCart`,
    description: `Shop ${sellerResult.seller.shopName}'s products on VibeCart`,
  };
}
