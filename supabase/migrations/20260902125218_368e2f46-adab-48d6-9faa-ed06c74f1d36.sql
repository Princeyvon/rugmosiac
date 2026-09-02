-- ============ ENUM EXTENSIONS ============
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'ready';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded';
ALTER TYPE custom_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE custom_status ADD VALUE IF NOT EXISTS 'cancelled';
