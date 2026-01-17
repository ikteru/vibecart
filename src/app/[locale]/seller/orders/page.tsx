import { getCurrentSeller } from '@/lib/auth/getCurrentSeller';
import { createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { GetSellerOrders } from '@/application/use-cases/orders/GetSellerOrders';
import { OrdersList } from '@/presentation/components/seller/OrdersList';

interface OrdersPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Seller Orders Page
 *
 * Server component that fetches real orders from the database.
 * Passes orders to the client component for filtering/interaction.
 */
export default async function OrdersPage({ params }: OrdersPageProps) {
  const { locale } = await params;

  // Get authenticated seller
  const seller = await getCurrentSeller(locale);

  // Fetch orders from database
  const supabase = await createClient();
  const { orderRepository } = createRepositories(supabase);

  const getOrdersUseCase = new GetSellerOrders(orderRepository);
  const result = await getOrdersUseCase.execute({
    sellerId: seller.id,
    limit: 50, // Fetch up to 50 orders
  });

  return <OrdersList orders={result.orders} />;
}
