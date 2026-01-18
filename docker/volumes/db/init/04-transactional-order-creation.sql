-- ============================================================
-- Transactional Order Creation Migration
-- ============================================================
-- Creates a PostgreSQL function that handles order creation,
-- order items insertion, and stock decrease atomically.
-- If any step fails, the entire transaction is rolled back.
-- ============================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_order_with_items(JSONB);

-- ============================================================
-- Create Order With Items Function
-- ============================================================
-- Parameters (as JSONB):
--   order_data: {
--     id, order_number, seller_id, customer_name, customer_phone,
--     address_city, address_neighborhood, address_street,
--     address_building_name, address_floor, address_apartment_number,
--     address_delivery_instructions, location_lat, location_lng,
--     location_url, subtotal, shipping_cost, total, currency
--   }
--   items: [{
--     id, product_id, title, price_amount, price_currency, quantity, selected_variant
--   }]
--   decrease_stock: boolean (whether to decrease product stock)
-- ============================================================
CREATE OR REPLACE FUNCTION create_order_with_items(input JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_data JSONB;
  v_items JSONB;
  v_decrease_stock BOOLEAN;
  v_item JSONB;
  v_product RECORD;
  v_order_id UUID;
  v_result JSONB;
BEGIN
  -- Extract parameters
  v_order_data := input->'order_data';
  v_items := input->'items';
  v_decrease_stock := COALESCE((input->>'decrease_stock')::BOOLEAN, false);
  v_order_id := (v_order_data->>'id')::UUID;

  -- Step 1: Validate stock for all items (if stock decrease is requested)
  IF v_decrease_stock THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
      -- Skip if no product_id (custom item)
      IF v_item->>'product_id' IS NOT NULL AND v_item->>'product_id' != '' THEN
        SELECT id, stock, title INTO v_product
        FROM products
        WHERE id = (v_item->>'product_id')::UUID
        FOR UPDATE; -- Lock the row to prevent concurrent modifications

        IF NOT FOUND THEN
          -- Product doesn't exist, skip stock validation
          CONTINUE;
        END IF;

        IF v_product.stock < (v_item->>'quantity')::INTEGER THEN
          RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Requested: %',
            v_product.title, v_product.stock, (v_item->>'quantity')::INTEGER;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Step 2: Insert order
  INSERT INTO orders (
    id,
    order_number,
    seller_id,
    customer_name,
    customer_phone,
    address_city,
    address_neighborhood,
    address_street,
    address_building_name,
    address_floor,
    address_apartment_number,
    address_delivery_instructions,
    location_lat,
    location_lng,
    location_url,
    status,
    subtotal,
    shipping_cost,
    total,
    currency
  ) VALUES (
    v_order_id,
    v_order_data->>'order_number',
    (v_order_data->>'seller_id')::UUID,
    v_order_data->>'customer_name',
    v_order_data->>'customer_phone',
    v_order_data->>'address_city',
    v_order_data->>'address_neighborhood',
    v_order_data->>'address_street',
    v_order_data->>'address_building_name',
    v_order_data->>'address_floor',
    v_order_data->>'address_apartment_number',
    v_order_data->>'address_delivery_instructions',
    (v_order_data->>'location_lat')::DECIMAL,
    (v_order_data->>'location_lng')::DECIMAL,
    v_order_data->>'location_url',
    'pending',
    (v_order_data->>'subtotal')::INTEGER,
    (v_order_data->>'shipping_cost')::INTEGER,
    (v_order_data->>'total')::INTEGER,
    COALESCE(v_order_data->>'currency', 'MAD')
  );

  -- Step 3: Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    INSERT INTO order_items (
      id,
      order_id,
      product_id,
      title,
      price_amount,
      price_currency,
      quantity,
      selected_variant
    ) VALUES (
      (v_item->>'id')::UUID,
      v_order_id,
      NULLIF(v_item->>'product_id', '')::UUID,
      v_item->>'title',
      (v_item->>'price_amount')::INTEGER,
      COALESCE(v_item->>'price_currency', 'MAD'),
      (v_item->>'quantity')::INTEGER,
      v_item->>'selected_variant'
    );
  END LOOP;

  -- Step 4: Decrease stock (if requested)
  IF v_decrease_stock THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
      IF v_item->>'product_id' IS NOT NULL AND v_item->>'product_id' != '' THEN
        UPDATE products
        SET stock = stock - (v_item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE id = (v_item->>'product_id')::UUID;
      END IF;
    END LOOP;
  END IF;

  -- Return success with order ID
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Return error details (transaction is automatically rolled back)
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_order_with_items TO anon, authenticated, service_role;

-- ============================================================
-- Done!
-- ============================================================
SELECT 'Transactional order creation function created successfully!' as status;
