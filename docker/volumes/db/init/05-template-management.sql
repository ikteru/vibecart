-- ============================================================
-- WhatsApp Template Management Migration
-- ============================================================
-- Extends template tables to support:
-- - Meta template ID tracking after submission
-- - Rejection reasons for failed approvals
-- - DRAFT status for templates not yet submitted
-- - Event bindings to assign templates to order notifications
-- ============================================================

-- ============================================================
-- Alter whatsapp_message_templates table
-- ============================================================

-- Add Meta template ID (returned after submission to Meta)
ALTER TABLE whatsapp_message_templates
ADD COLUMN IF NOT EXISTS meta_template_id TEXT;

-- Add rejection reason (populated when Meta rejects template)
ALTER TABLE whatsapp_message_templates
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add description for seller reference
ALTER TABLE whatsapp_message_templates
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update status constraint to include DRAFT
-- First drop the constraint if it exists, then add it fresh
ALTER TABLE whatsapp_message_templates
DROP CONSTRAINT IF EXISTS whatsapp_message_templates_status_check;

ALTER TABLE whatsapp_message_templates
ADD CONSTRAINT whatsapp_message_templates_status_check
CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED'));

-- Update category constraint
ALTER TABLE whatsapp_message_templates
DROP CONSTRAINT IF EXISTS whatsapp_message_templates_category_check;

ALTER TABLE whatsapp_message_templates
ADD CONSTRAINT whatsapp_message_templates_category_check
CHECK (category IN ('UTILITY', 'MARKETING', 'AUTHENTICATION'));

-- Update language constraint
ALTER TABLE whatsapp_message_templates
DROP CONSTRAINT IF EXISTS whatsapp_message_templates_language_check;

ALTER TABLE whatsapp_message_templates
ADD CONSTRAINT whatsapp_message_templates_language_check
CHECK (template_language IN ('ar', 'en', 'fr'));

-- Create index on meta_template_id for lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_meta_id
  ON whatsapp_message_templates(meta_template_id)
  WHERE meta_template_id IS NOT NULL;

-- ============================================================
-- WhatsApp Template Event Bindings Table
-- ============================================================
-- Links approved templates to specific order notification events
-- Each seller can have one template per event type

CREATE TABLE IF NOT EXISTS whatsapp_template_event_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  template_id UUID NOT NULL REFERENCES whatsapp_message_templates(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each seller can only have one binding per event type
  UNIQUE(seller_id, event_type)
);

-- Validate event_type values
ALTER TABLE whatsapp_template_event_bindings
ADD CONSTRAINT whatsapp_template_event_bindings_event_type_check
CHECK (event_type IN (
  'ORDER_PENDING_CONFIRMATION',
  'ORDER_CONFIRMED',
  'ORDER_SHIPPED',
  'ORDER_DELIVERED',
  'ORDER_CANCELLED'
));

-- ============================================================
-- Indexes for Event Bindings
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_template_bindings_seller
  ON whatsapp_template_event_bindings(seller_id);

CREATE INDEX IF NOT EXISTS idx_template_bindings_template
  ON whatsapp_template_event_bindings(template_id);

CREATE INDEX IF NOT EXISTS idx_template_bindings_event
  ON whatsapp_template_event_bindings(seller_id, event_type)
  WHERE is_enabled = true;

-- ============================================================
-- Updated At Trigger for Event Bindings
-- ============================================================

CREATE TRIGGER trigger_template_bindings_updated_at
  BEFORE UPDATE ON whatsapp_template_event_bindings
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_tokens_updated_at();

-- ============================================================
-- Row Level Security for Event Bindings
-- ============================================================

ALTER TABLE whatsapp_template_event_bindings ENABLE ROW LEVEL SECURITY;

-- Sellers can only access their own bindings
CREATE POLICY "Sellers access own template bindings"
  ON whatsapp_template_event_bindings
  FOR ALL
  USING (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- Helper Functions
-- ============================================================

-- Get the assigned template for a seller and event type
-- Returns NULL if no binding exists or template is not approved
CREATE OR REPLACE FUNCTION get_assigned_template(
  p_seller_id UUID,
  p_event_type TEXT
)
RETURNS TABLE (
  template_id UUID,
  template_name TEXT,
  template_language TEXT,
  meta_template_id TEXT,
  components JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS template_id,
    t.template_name,
    t.template_language,
    t.meta_template_id,
    t.components
  FROM whatsapp_template_event_bindings b
  INNER JOIN whatsapp_message_templates t ON t.id = b.template_id
  WHERE b.seller_id = p_seller_id
    AND b.event_type = p_event_type
    AND b.is_enabled = true
    AND t.status = 'APPROVED';
END;
$$;

-- Get template statistics for a seller
CREATE OR REPLACE FUNCTION get_template_stats(p_seller_id UUID)
RETURNS TABLE (
  total_templates BIGINT,
  draft_count BIGINT,
  pending_count BIGINT,
  approved_count BIGINT,
  rejected_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_templates,
    COUNT(*) FILTER (WHERE status = 'DRAFT') AS draft_count,
    COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_count,
    COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved_count,
    COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected_count
  FROM whatsapp_message_templates
  WHERE seller_id = p_seller_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_assigned_template TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_template_stats TO authenticated, service_role;

-- ============================================================
-- Done!
-- ============================================================
SELECT 'WhatsApp template management migration completed successfully!' as status;
