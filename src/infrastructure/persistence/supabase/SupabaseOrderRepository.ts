import type { SupabaseClient } from '@supabase/supabase-js';
import { Order, OrderStatus, OrderItem, ChatMessage } from '@/domain/entities/Order';
import { OrderRepository } from '@/domain/repositories/OrderRepository';
import { Money, Currency } from '@/domain/value-objects/Money';
import { Address } from '@/domain/value-objects/Address';
import { PhoneNumber } from '@/domain/value-objects/PhoneNumber';
import type { OrderRow, OrderItemRow, OrderMessageRow } from './types';

/**
 * SupabaseOrderRepository
 *
 * Supabase implementation of the OrderRepository interface.
 * Handles orders, order_items, and order_messages tables.
 */
export class SupabaseOrderRepository implements OrderRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Order | null> {
    const { data: orderData, error: orderError } = await this.supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !orderData) {
      return null;
    }

    return this.fetchOrderWithRelations(orderData as OrderRow);
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const { data: orderData, error: orderError } = await this.supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (orderError || !orderData) {
      return null;
    }

    return this.fetchOrderWithRelations(orderData as OrderRow);
  }

  async findByOrderNumberAndSeller(
    orderNumber: string,
    sellerId: string
  ): Promise<Order | null> {
    const { data: orderData, error: orderError } = await this.supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .eq('seller_id', sellerId)
      .single();

    if (orderError || !orderData) {
      return null;
    }

    return this.fetchOrderWithRelations(orderData as OrderRow);
  }

  async findLatestByBuyerAndSeller(
    buyerPhone: string,
    sellerId: string
  ): Promise<Order | null> {
    // Normalize phone number for search
    const normalizedPhone = buyerPhone.replace(/\D/g, '');

    const { data: orderData, error: orderError } = await this.supabase
      .from('orders')
      .select('*')
      .eq('seller_id', sellerId)
      .ilike('customer_phone', `%${normalizedPhone.slice(-9)}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (orderError || !orderData) {
      return null;
    }

    return this.fetchOrderWithRelations(orderData as OrderRow);
  }

  async findBySellerId(
    sellerId: string,
    options?: {
      status?: OrderStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<Order[]> {
    let query = this.supabase
      .from('orders')
      .select('*')
      .eq('seller_id', sellerId);

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 20) - 1
      );
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    // Fetch items and messages for each order
    const orders = await Promise.all(
      data.map((row) => this.fetchOrderWithRelations(row as OrderRow))
    );

    return orders.filter((order): order is Order => order !== null);
  }

  async findByBuyerPhone(
    buyerPhone: string,
    options?: {
      sellerId?: string;
      limit?: number;
    }
  ): Promise<Order[]> {
    // Normalize phone number for search
    const normalizedPhone = buyerPhone.replace(/\D/g, '');

    let query = this.supabase
      .from('orders')
      .select('*')
      .ilike('customer_phone', `%${normalizedPhone.slice(-9)}%`);

    if (options?.sellerId) {
      query = query.eq('seller_id', options.sellerId);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    const orders = await Promise.all(
      data.map((row) => this.fetchOrderWithRelations(row as OrderRow))
    );

    return orders.filter((order): order is Order => order !== null);
  }

  async createWithItems(order: Order, decreaseStock: boolean): Promise<Order> {
    const props = order.toPersistence();

    // Prepare order data for the RPC function
    const orderData = {
      id: props.id,
      order_number: props.orderNumber,
      seller_id: props.sellerId,
      customer_name: props.customerName,
      customer_phone: props.customerPhone.toWhatsAppFormat(),
      address_city: props.shippingAddress.city,
      address_neighborhood: props.shippingAddress.neighborhood || null,
      address_street: props.shippingAddress.street,
      address_building_name: props.shippingAddress.buildingName || null,
      address_floor: props.shippingAddress.floor || null,
      address_apartment_number: props.shippingAddress.apartmentNumber || null,
      address_delivery_instructions: props.shippingAddress.deliveryInstructions || null,
      location_lat: props.shippingAddress.location?.lat || null,
      location_lng: props.shippingAddress.location?.lng || null,
      location_url: props.shippingAddress.locationUrl || null,
      subtotal: props.subtotal.toCents(),
      shipping_cost: props.shippingCost.toCents(),
      total: props.total.toCents(),
      currency: props.total.currency,
    };

    // Prepare items for the RPC function
    const items = props.items.map((item) => ({
      id: item.id,
      product_id: item.productId || null,
      title: item.title,
      price_amount: item.price.toCents(),
      price_currency: item.price.currency,
      quantity: item.quantity,
      selected_variant: item.selectedVariant || null,
    }));

    // Call the transactional RPC function
    const { data, error } = await this.supabase.rpc('create_order_with_items', {
      input: {
        order_data: orderData,
        items,
        decrease_stock: decreaseStock,
      },
    });

    if (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }

    // Check RPC result for application-level errors
    if (data && !data.success) {
      throw new Error(data.error || 'Failed to create order');
    }

    // Return the created order
    const createdOrder = await this.findById(props.id);
    if (!createdOrder) {
      throw new Error('Order was created but could not be retrieved');
    }

    return createdOrder;
  }

  async save(order: Order): Promise<void> {
    const props = order.toPersistence();

    // Convert to database row
    const orderRow: Omit<OrderRow, 'created_at' | 'updated_at'> & {
      created_at?: string;
      updated_at?: string;
    } = {
      id: props.id,
      order_number: props.orderNumber,
      seller_id: props.sellerId,
      customer_name: props.customerName,
      customer_phone: props.customerPhone.toWhatsAppFormat(),
      address_city: props.shippingAddress.city,
      address_neighborhood: props.shippingAddress.neighborhood,
      address_street: props.shippingAddress.street,
      address_building_name: props.shippingAddress.buildingName,
      address_floor: props.shippingAddress.floor,
      address_apartment_number: props.shippingAddress.apartmentNumber,
      address_delivery_instructions: props.shippingAddress.deliveryInstructions,
      location_lat: props.shippingAddress.location?.lat || null,
      location_lng: props.shippingAddress.location?.lng || null,
      location_url: props.shippingAddress.locationUrl,
      status: props.status,
      subtotal: props.subtotal.toCents(),
      shipping_cost: props.shippingCost.toCents(),
      total: props.total.toCents(),
      currency: props.total.currency,
      confirmed_at: props.confirmedAt?.toISOString() || null,
      shipped_at: props.shippedAt?.toISOString() || null,
      delivered_at: props.deliveredAt?.toISOString() || null,
    };

    // Upsert order
    const { error: orderError } = await this.supabase
      .from('orders')
      .upsert(orderRow, { onConflict: 'id' });

    if (orderError) {
      throw new Error(`Failed to save order: ${orderError.message}`);
    }

    // Delete existing items and insert new ones
    await this.supabase
      .from('order_items')
      .delete()
      .eq('order_id', props.id);

    if (props.items.length > 0) {
      const itemRows: Omit<OrderItemRow, 'created_at'>[] = props.items.map(
        (item) => ({
          id: item.id,
          order_id: props.id,
          product_id: item.productId,
          title: item.title,
          price_amount: item.price.toCents(),
          price_currency: item.price.currency,
          quantity: item.quantity,
          selected_variant: item.selectedVariant || null,
        })
      );

      const { error: itemsError } = await this.supabase
        .from('order_items')
        .insert(itemRows);

      if (itemsError) {
        throw new Error(`Failed to save order items: ${itemsError.message}`);
      }
    }

    // Insert new messages (append only, don't delete existing)
    const existingMessageIds = await this.getExistingMessageIds(props.id);
    const newMessages = props.messages.filter(
      (msg) => !existingMessageIds.includes(msg.id)
    );

    if (newMessages.length > 0) {
      const messageRows: Omit<OrderMessageRow, 'created_at'>[] = newMessages.map(
        (msg) => ({
          id: msg.id,
          order_id: props.id,
          sender: msg.sender,
          content: msg.content,
          read_at: null, // New messages start as unread
        })
      );

      const { error: messagesError } = await this.supabase
        .from('order_messages')
        .insert(messageRows);

      if (messagesError) {
        throw new Error(`Failed to save order messages: ${messagesError.message}`);
      }
    }
  }

  async countBySellerId(sellerId: string, status?: OrderStatus): Promise<number> {
    let query = this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId);

    if (status) {
      query = query.eq('status', status);
    }

    const { count, error } = await query;

    if (error) {
      return 0;
    }

    return count || 0;
  }

  /**
   * Get order statistics for a seller
   */
  async getStats(sellerId: string): Promise<{
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    ordersToday: number;
  }> {
    // Try using the helper function first
    const { data, error } = await this.supabase.rpc('get_seller_order_stats', {
      p_seller_id: sellerId,
    });

    if (!error && data && data.length > 0) {
      return {
        totalOrders: Number(data[0].total_orders) || 0,
        pendingOrders: Number(data[0].pending_orders) || 0,
        totalRevenue: Number(data[0].total_revenue) || 0,
        ordersToday: Number(data[0].orders_today) || 0,
      };
    }

    // Fallback to manual queries if function doesn't exist
    const [totalResult, pendingResult, revenueResult, todayResult] =
      await Promise.all([
        this.supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', sellerId),
        this.supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', sellerId)
          .eq('status', 'pending'),
        this.supabase
          .from('orders')
          .select('total')
          .eq('seller_id', sellerId)
          .in('status', ['confirmed', 'shipped', 'delivered']),
        this.supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', sellerId)
          .gte('created_at', new Date().toISOString().split('T')[0]),
      ]);

    const totalRevenue =
      revenueResult.data?.reduce((sum, row) => sum + (row.total || 0), 0) || 0;

    return {
      totalOrders: totalResult.count || 0,
      pendingOrders: pendingResult.count || 0,
      totalRevenue,
      ordersToday: todayResult.count || 0,
    };
  }

  /**
   * Get unread message counts for multiple orders
   */
  async getUnreadCountsForOrders(orderIds: string[]): Promise<Map<string, number>> {
    if (orderIds.length === 0) {
      return new Map();
    }

    const { data, error } = await this.supabase
      .from('order_messages')
      .select('order_id')
      .in('order_id', orderIds)
      .eq('sender', 'buyer')
      .is('read_at', null);

    if (error || !data) {
      return new Map();
    }

    // Count unread messages per order
    const counts = new Map<string, number>();
    data.forEach((row) => {
      const current = counts.get(row.order_id) || 0;
      counts.set(row.order_id, current + 1);
    });

    return counts;
  }

  /**
   * Mark all buyer messages in an order as read
   */
  async markMessagesAsRead(orderId: string): Promise<void> {
    const { error } = await this.supabase
      .from('order_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('order_id', orderId)
      .eq('sender', 'buyer')
      .is('read_at', null);

    if (error) {
      throw new Error(`Failed to mark messages as read: ${error.message}`);
    }
  }

  /**
   * Fetch order items and messages, then construct domain entity
   */
  private async fetchOrderWithRelations(
    orderRow: OrderRow
  ): Promise<Order | null> {
    // Fetch items
    const { data: itemsData } = await this.supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderRow.id)
      .order('created_at', { ascending: true });

    // Fetch messages
    const { data: messagesData } = await this.supabase
      .from('order_messages')
      .select('*')
      .eq('order_id', orderRow.id)
      .order('created_at', { ascending: true });

    return this.toDomain(
      orderRow,
      (itemsData as OrderItemRow[]) || [],
      (messagesData as OrderMessageRow[]) || []
    );
  }

  /**
   * Get IDs of existing messages for an order
   */
  private async getExistingMessageIds(orderId: string): Promise<string[]> {
    const { data } = await this.supabase
      .from('order_messages')
      .select('id')
      .eq('order_id', orderId);

    return data?.map((row) => row.id) || [];
  }

  /**
   * Convert database rows to domain entity
   */
  private toDomain(
    orderRow: OrderRow,
    itemRows: OrderItemRow[],
    messageRows: OrderMessageRow[]
  ): Order {
    const currency = (orderRow.currency || 'MAD') as Currency;

    // Convert items
    const items: OrderItem[] = itemRows.map((row) => ({
      id: row.id,
      productId: row.product_id || '',
      title: row.title,
      price: Money.fromCents(row.price_amount, (row.price_currency || currency) as Currency),
      quantity: row.quantity,
      selectedVariant: row.selected_variant || undefined,
    }));

    // Convert messages
    const messages: ChatMessage[] = messageRows.map((row) => ({
      id: row.id,
      sender: row.sender as 'buyer' | 'seller' | 'system',
      content: row.content,
      createdAt: new Date(row.created_at),
    }));

    // Build address
    const address = Address.create({
      city: orderRow.address_city,
      neighborhood: orderRow.address_neighborhood || undefined,
      street: orderRow.address_street,
      buildingName: orderRow.address_building_name || undefined,
      floor: orderRow.address_floor || undefined,
      apartmentNumber: orderRow.address_apartment_number || undefined,
      deliveryInstructions: orderRow.address_delivery_instructions || undefined,
      location:
        orderRow.location_lat && orderRow.location_lng
          ? {
              lat: Number(orderRow.location_lat),
              lng: Number(orderRow.location_lng),
            }
          : undefined,
      locationUrl: orderRow.location_url || undefined,
    });

    return Order.fromPersistence({
      id: orderRow.id,
      orderNumber: orderRow.order_number,
      sellerId: orderRow.seller_id,
      customerName: orderRow.customer_name,
      customerPhone: PhoneNumber.create(orderRow.customer_phone),
      shippingAddress: address,
      items,
      subtotal: Money.fromCents(orderRow.subtotal, currency),
      shippingCost: Money.fromCents(orderRow.shipping_cost, currency),
      total: Money.fromCents(orderRow.total, currency),
      status: orderRow.status as OrderStatus,
      messages,
      createdAt: new Date(orderRow.created_at),
      updatedAt: new Date(orderRow.updated_at),
      confirmedAt: orderRow.confirmed_at
        ? new Date(orderRow.confirmed_at)
        : undefined,
      shippedAt: orderRow.shipped_at ? new Date(orderRow.shipped_at) : undefined,
      deliveredAt: orderRow.delivered_at
        ? new Date(orderRow.delivered_at)
        : undefined,
    });
  }
}
