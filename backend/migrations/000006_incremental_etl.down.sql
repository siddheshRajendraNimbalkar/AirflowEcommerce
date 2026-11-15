
DROP TABLE IF EXISTS processed_orders;

DROP TABLE IF EXISTS etl_watermarks;

DROP TRIGGER IF EXISTS orders_updated_at_trigger ON orders;

DROP FUNCTION IF EXISTS update_order_timestamp();

ALTER TABLE orders
DROP COLUMN IF EXISTS updated_at;
