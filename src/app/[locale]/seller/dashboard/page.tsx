import Link from 'next/link';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { TrendingUp, ShoppingBag, Plus, Sparkles } from 'lucide-react';
import { getCurrentSeller } from '@/lib/auth/getCurrentSeller';
import { createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories, SupabaseOrderRepository } from '@/infrastructure/persistence/supabase';
import { GetOrderStats } from '@/application/use-cases/orders/GetOrderStats';
import { GetSellerOrders } from '@/application/use-cases/orders/GetSellerOrders';
import { InstagramHealthBanner } from '@/presentation/components/seller/InstagramHealthBanner';
import { DashboardClientSection } from './DashboardClientSection';

interface DashboardPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Seller Dashboard Overview Page
 *
 * Shows key metrics, quick actions, and recent activity.
 * Fetches real data from the database.
 */
export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const t = await getTranslations();

  // Get authenticated seller
  const seller = await getCurrentSeller(locale);
  const sellerName = seller.shopName;

  // Get order statistics
  const supabase = await createClient();
  const { orderRepository } = createRepositories(supabase);

  // GetOrderStats needs SupabaseOrderRepository specifically for getStats method
  const orderStatsUseCase = new GetOrderStats(orderRepository as SupabaseOrderRepository);
  const stats = await orderStatsUseCase.execute({ sellerId: seller.id });

  // Get recent orders for activity feed
  const getOrdersUseCase = new GetSellerOrders(orderRepository);
  const recentOrdersResult = await getOrdersUseCase.execute({
    sellerId: seller.id,
    limit: 5,
  });

  // Fetch active product count and draft products for onboarding UI
  const { productRepository } = createRepositories(supabase);
  const activeProducts = await productRepository.findBySellerId(seller.id, { isActive: true });
  const activeProductCount = activeProducts.length;

  const draftProducts = await productRepository.findBySellerId(seller.id, { isActive: false });
  const draftsForClient = draftProducts.map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price.amount,
    category: p.category.value,
    videoUrl: p.videoUrl || '',
  }));

  // Convert cents to display amount
  const totalRevenue = Math.round(stats.totalRevenue / 100);
  const pendingOrderCount = stats.pendingOrders;

  return (
    <div className="animate-fade-in pb-24">
      {/* Instagram Health Banner */}
      <InstagramHealthBanner />

      {/* Onboarding & Quick Setup Components */}
      <Suspense fallback={null}>
        <DashboardClientSection
          seller={seller}
          productCount={activeProductCount}
          drafts={draftsForClient}
        />
      </Suspense>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          {t('seller.dashboard.hello', { name: sellerName.split(' ')[0] })} 👋
        </h2>
        <p className="text-zinc-400 text-xs">{t('seller.dashboard.subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 end-0 p-3 opacity-10">
            <TrendingUp size={40} />
          </div>
          <p className="text-xs font-bold text-zinc-500 uppercase mb-1">{t('seller.dashboard.totalRevenue')}</p>
          <h3 className="text-2xl font-bold text-white">
            {totalRevenue.toLocaleString()}{' '}
            <span className="text-xs font-normal text-zinc-500">{t('currency.MAD_symbol')}</span>
          </h3>
          {stats.ordersToday > 0 && (
            <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1">
              <TrendingUp size={10} /> {t('seller.dashboard.ordersToday', { count: stats.ordersToday })}
            </div>
          )}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 end-0 p-3 opacity-10">
            <ShoppingBag size={40} />
          </div>
          <p className="text-xs font-bold text-zinc-500 uppercase mb-1">{t('seller.dashboard.pendingOrders')}</p>
          <h3 className="text-2xl font-bold text-white">{pendingOrderCount}</h3>
          <div className="mt-2 text-[10px] text-zinc-500">
            {pendingOrderCount > 0 ? t('seller.dashboard.needsAttention') : t('seller.dashboard.allCaughtUp')}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <h3 className="text-sm font-bold text-white mb-3">{t('seller.dashboard.quickActions')}</h3>
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link
          href={`/${locale}/seller/inventory/new`}
          className="h-28 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-zinc-900 border border-emerald-500/20 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 group transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-all">
            <Plus size={20} />
          </div>
          <span className="text-xs font-bold text-white">{t('seller.dashboard.newDrop')}</span>
        </Link>

        <Link
          href={`/${locale}/seller/vibe`}
          className="h-28 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 flex flex-col items-center justify-center gap-2 group transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white flex items-center justify-center transition-all">
            <Sparkles size={20} />
          </div>
          <span className="text-xs font-bold text-white">{t('seller.vibe.title')}</span>
        </Link>
      </div>

      {/* Recent Activity */}
      <h3 className="text-sm font-bold text-white mb-3">{t('seller.dashboard.recentActivity')}</h3>
      <div className="space-y-2">
        {recentOrdersResult.orders.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center">
            <p className="text-zinc-500 text-sm">{t('seller.dashboard.noRecentOrders')}</p>
          </div>
        ) : (
          recentOrdersResult.orders.map((order) => (
            <Link
              key={order.id}
              href={`/${locale}/seller/orders?order=${order.orderNumber}`}
              className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 border border-zinc-700">
                  {order.customerName.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{order.customerName}</p>
                  <p className="text-[10px] text-zinc-500 truncate max-w-[150px]">{order.itemsSummary}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400">
                +{order.total.amount} {t('currency.MAD_symbol')}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
