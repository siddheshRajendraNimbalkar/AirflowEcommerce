-- name: GetCustomers :many
SELECT customer_id, name, email, created_at
FROM customers
ORDER BY customer_id DESC;

-- name: GetCustomerByID :one
SELECT customer_id, name, email, created_at
FROM customers
WHERE customer_id = $1;

-- name: CreateCustomer :one
INSERT INTO customers (name, email)
VALUES ($1, $2)
RETURNING customer_id, name, email, created_at;

-- name: UpdateCustomer :one
UPDATE customers
SET name = $2, email = $3
WHERE customer_id = $1
RETURNING customer_id, name, email, created_at;

-- name: DeleteCustomer :exec
DELETE FROM customers
WHERE customer_id = $1;