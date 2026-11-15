-- name: GetSalesOverview :one
SELECT
    COUNT(*) AS total_orders,
    COALESCE(SUM(total_amount), 0)::numeric AS total_revenue,
    COALESCE(AVG(total_amount), 0)::numeric AS average_order_value
FROM orders;

-- name: GetDailySales :many
SELECT
    report_date,
    total_orders,
    total_revenue
FROM (
    SELECT
        report_date,
        total_orders,
        total_revenue
    FROM sales_analytics
    ORDER BY report_date DESC
    LIMIT 30
) AS recent_sales
ORDER BY report_date ASC;

-- name: GetTopProducts :many
SELECT
    p.product_id,
    p.product_name,
    SUM(o.quantity)::bigint AS units_sold,
    SUM(o.total_amount)::numeric AS revenue
FROM orders o
JOIN products p ON p.product_id = o.product_id
GROUP BY p.product_id, p.product_name
ORDER BY revenue DESC
LIMIT 10;