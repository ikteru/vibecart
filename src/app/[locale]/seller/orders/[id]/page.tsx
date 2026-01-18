import { notFound } from 'next/navigation';
import { getCurrentSeller } from '@/lib/auth/getCurrentSeller';
import { createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { GetOrder } from '@/application/use-cases/orders/GetOrder';
import { UpdateOrderStatus } from '@/application/use-cases/orders/UpdateOrderStatus';
import { AddOrderMessage } from '@/application/use-cases/orders/AddOrderMessage';
import { OrderDetail } from '@/presentation/components/seller/OrderDetail';
import type { UpdateOrderStatusDTO, AddOrderMessageDTO } from '@/application/dtos/OrderDTO';

interface OrderDetailPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

/**
 * Order Detail Page
 *
 * Server component that fetches order and provides server actions.
 */
export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { locale, id: orderId } = await params;

  // Get authenticated seller
  const seller = await getCurrentSeller(locale);

  // Fetch order from database
  const supabase = await createClient();
  const { orderRepository } = createRepositories(supabase);

  const getOrderUseCase = new GetOrder(orderRepository);
  const result = await getOrderUseCase.execute({ orderId });

  // Order not found or doesn't belong to this seller
  if (!result.order || result.order.sellerId !== seller.id) {
    notFound();
  }

  // Capture seller ID for server actions
  const sellerId = seller.id;

  // Server action for updating order status
  async function updateStatus(action: UpdateOrderStatusDTO['action']) {
    'use server';

    const supabaseServer = await createClient();
    const repos = createRepositories(supabaseServer);

    // Pass WhatsApp repositories for sending notifications
    const updateUseCase = new UpdateOrderStatus(
      repos.orderRepository,
      repos.whatsAppTokenRepository,
      repos.whatsAppMessageRepository
    );
    const updateResult = await updateUseCase.execute({
      orderId,
      action,
    });

    if (!updateResult.success) {
      return { success: false, error: updateResult.error || 'Failed to update status' };
    }

    return { success: true, order: updateResult.order };
  }

  // Server action for sending a message
  async function sendMessage(content: string) {
    'use server';

    const supabaseServer = await createClient();
    const repos = createRepositories(supabaseServer);

    const messageInput: AddOrderMessageDTO = {
      orderId,
      sender: 'seller',
      content,
    };

    const addMessageUseCase = new AddOrderMessage(repos.orderRepository);
    const messageResult = await addMessageUseCase.execute(messageInput);

    if (!messageResult.success) {
      return { success: false, error: messageResult.error || 'Failed to send message' };
    }

    return { success: true };
  }

  return (
    <OrderDetail
      order={result.order}
      locale={locale}
      sellerId={sellerId}
      updateStatusAction={updateStatus}
      sendMessageAction={sendMessage}
    />
  );
}
