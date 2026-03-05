-- ============================================================
-- Make WhatsApp number optional for Instagram-first onboarding
-- ============================================================

-- Allow NULL for whatsapp_number
ALTER TABLE sellers ALTER COLUMN whatsapp_number DROP NOT NULL;

-- Update constraint to allow NULL
ALTER TABLE sellers DROP CONSTRAINT IF EXISTS whatsapp_format;
ALTER TABLE sellers ADD CONSTRAINT whatsapp_format
  CHECK (whatsapp_number IS NULL OR whatsapp_number ~ '^212[567]\d{8}$');
