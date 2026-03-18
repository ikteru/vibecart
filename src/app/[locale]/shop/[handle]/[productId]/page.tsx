import { notFound } from 'next/navigation';
import { createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { GetSellerByHandle } from '@/application/use-cases/sellers';
import { GetSellerProducts } from '@/application/use-cases/products';
import { ProductPageClient } from './ProductPageClient';

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: Promise<{
    locale: string;
    handle: string;
    productId: string;
  }>;
}

/**
 * Product Page (Server Component)
 *
 * Shareable URL for a specific product. Renders the reel view
 * scrolled to the target product, with all seller's products available for scrolling.
 */
export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, handle, productId } = await params;

  const supabase = await createClient();
  const { sellerRepository, productRepository } = createRepositories(supabase);

  const getSellerUseCase = new GetSellerByHandle(sellerRepository);
  const sellerResult = await getSellerUseCase.execute({ handle, locale });

  if (!sellerResult.seller) {
    notFound();
  }

  const getProductsUseCase = new GetSellerProducts(productRepository);
  const productsResult = await getProductsUseCase.execute({
    sellerId: sellerResult.seller.id,
    isActive: true,
  });

  // Verify the target product exists in this seller's products
  const productExists = productsResult.products.some((p) => p.id === productId);
  if (!productExists) {
    notFound();
  }

  return (
    <ProductPageClient
      seller={sellerResult.seller}
      products={productsResult.products}
      initialProductId={productId}
    />
  );
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { handle, productId } = await params;

  const supabase = await createClient();
  const { sellerRepository, productRepository } = createRepositories(supabase);

  const getSellerUseCase = new GetSellerByHandle(sellerRepository);
  const sellerResult = await getSellerUseCase.execute({ handle });

  if (!sellerResult.seller) {
    return { title: 'Product Not Found' };
  }

  const getProductsUseCase = new GetSellerProducts(productRepository);
  const productsResult = await getProductsUseCase.execute({
    sellerId: sellerResult.seller.id,
    isActive: true,
  });

  const product = productsResult.products.find((p) => p.id === productId);

  return {
    title: product
      ? `${product.title} | ${sellerResult.seller.shopName}`
      : `${sellerResult.seller.shopName} | VibeCart`,
    description: product
      ? `${product.title} - Shop on VibeCart`
      : `Shop ${sellerResult.seller.shopName}'s products on VibeCart`,
  };
}
