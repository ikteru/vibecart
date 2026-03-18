-- Device push notification tokens for mobile apps (FCM/APNs)
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios')),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  customer_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_seller ON device_tokens(seller_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_phone ON device_tokens(customer_phone);
