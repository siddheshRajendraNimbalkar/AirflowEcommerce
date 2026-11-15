-- name: GetProducts :many
SELECT product_id, product_name, price, stock_quantity
FROM products
ORDER BY product_id DESC;

-- name: GetProductByID :one
SELECT product_id, product_name, price, stock_quantity
FROM products
WHERE product_id = $1;

-- name: CreateProduct :one
INSERT INTO products (
    product_name, price, stock_quantity
)
VALUES ($1, $2, $3)
RETURNING product_id, product_name, price, stock_quantity;

-- name: UpdateProduct :one
UPDATE products
SET product_name = $2,
    price = $3,
    stock_quantity = $4
WHERE product_id = $1
RETURNING product_id, product_name, price, stock_quantity;

-- name: DeleteProduct :exec
DELETE FROM products
WHERE product_id = $1;