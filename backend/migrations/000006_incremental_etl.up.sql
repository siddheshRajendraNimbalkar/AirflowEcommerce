
-- Track order updates
ALTER TABLE orders
ADD COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE
NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Automatically update updated_at when an order changes
CREATE OR REPLACE FUNCTION update_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at_trigger
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_order_timestamp();

-- Store incrementally processed orders
CREATE TABLE processed_orders (
    order_id INTEGER PRIMARY KEY,
    total_amount NUMERIC(12, 2) NOT NULL,
    order_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    processed_at TIMESTAMP WITHOUT TIME ZONE
        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Track incremental processing progress
CREATE TABLE etl_watermarks (
    pipeline_name VARCHAR(100) PRIMARY KEY,
    last_processed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- Start from the beginning so the first incremental run
-- can process all existing orders.
INSERT INTO etl_watermarks (
    pipeline_name,
    last_processed_at
)
VALUES (
    'ecommerce_orders',
    '1970-01-01 00:00:00'
);
