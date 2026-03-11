import { getCurrentSeller } from '@/lib/auth/getCurrentSeller';
import { createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories, SupabaseOrderRepository } from '@/infrastructure/persistence/supabase';
import { GetOrderStats } from '@/application/use-cases/orders/GetOrderStats';
import { SellerProfileTab } from './SellerProfileTab';
import { ProductMapper } from '@/application/mappers/ProductMapper';

interface ProfilePageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Seller Profile Page (Server Component)
 *
 * Fetches seller data, order stats, and products for the profile tab.
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;

  const seller = await getCurrentSeller(locale);

  const supabase = await createClient();
  const { orderRepository, productRepository } = createRepositories(supabase);

  // Get order stats
  const orderStatsUseCase = new GetOrderStats(orderRepository as SupabaseOrderRepository);
  const stats = await orderStatsUseCase.execute({ sellerId: seller.id });

  // Get products
  const activeProducts = await productRepository.findBySellerId(seller.id, { isActive: true });
  const draftProducts = await productRepository.findBySellerId(seller.id, { isActive: false });

  const activeProductDTOs = activeProducts.map(ProductMapper.toDTO);
  const draftProductDTOs = draftProducts.map(ProductMapper.toDTO);

  return (
    <SellerProfileTab
      seller={seller}
      stats={{
        productCount: activeProducts.length,
        totalOrders: stats.totalOrders,
        totalRevenue: Math.round(stats.totalRevenue / 100),
      }}
      products={activeProductDTOs}
      drafts={draftProductDTOs}
      locale={locale}
    />
  );
}
