-- name: GetAllOrders :many
SELECT
    order_id,
    customer_id,
    product_id,
    quantity,
    total_amount,
    order_status,
    created_at
FROM orders
ORDER BY created_at DESC;


-- name: GetOrderByID :one
SELECT
    order_id,
    customer_id,
    product_id,
    quantity,
    total_amount,
    order_status,
    created_at
FROM orders
WHERE order_id = $1;


-- name: GetTotalRevenue :one
SELECT COALESCE(SUM(total_amount), 0)::numeric(14,2)
FROM orders;


-- name: GetTotalOrders :one
SELECT COUNT(*)
FROM orders;

-- name: GetOrdersPaginated :many
SELECT
    order_id,
    customer_id,
    product_id,
    quantity,
    total_amount,
    order_status,
    created_at
FROM orders
ORDER BY created_at DESC, order_id DESC
LIMIT $1
OFFSET $2;

-- name: GetOrdersByStatus :many
SELECT
    order_id,
    customer_id,
    product_id,
    quantity,
    total_amount,
    order_status,
    created_at
FROM orders
WHERE order_status = $1
ORDER BY created_at DESC;