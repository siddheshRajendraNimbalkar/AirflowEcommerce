package service

import (
	"context"
	"errors"
	"fmt"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"strings"
	"time"

	"github.com/siddheshRajendraNimbalkar/AirflowEcommerce/backend/internal/repository"
)

type CreateOrderInput struct {
	CustomerID int32 `json:"customer_id" binding:"required,gt=0"`
	ProductID  int32 `json:"product_id" binding:"required,gt=0"`
	Quantity   int32 `json:"quantity" binding:"required,gt=0"`
}

type CreatedOrder struct {
	OrderID     int32   `json:"order_id"`
	CustomerID  int32   `json:"customer_id"`
	ProductID   int32   `json:"product_id"`
	Quantity    int32   `json:"quantity"`
	TotalAmount float64 `json:"total_amount"`
	OrderStatus string  `json:"order_status"`
}

type Order struct {
	OrderID     int32     `json:"order_id"`
	CustomerID  int32     `json:"customer_id"`
	ProductID   int32     `json:"product_id"`
	Quantity    int32     `json:"quantity"`
	TotalAmount float64   `json:"total_amount"`
	OrderStatus string    `json:"order_status"`
	CreatedAt   time.Time `json:"created_at"`
}

type OrderService struct {
	repo *repository.OrderRepository
	db   *pgxpool.Pool
}

func NewOrderService(
	repo *repository.OrderRepository,
	db *pgxpool.Pool,
) *OrderService {
	return &OrderService{
		repo: repo,
		db:   db,
	}
}

// CreateOrder validates the customer and product,
// deducts stock and creates an order transactionally.
func (s *OrderService) CreateOrder(
	ctx context.Context,
	input CreateOrderInput,
) (*CreatedOrder, error) {

	if input.Quantity <= 0 {
		return nil, errors.New("quantity must be greater than zero")
	}

	tx, err := s.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Validate customer.
	var customerID int32

	err = tx.QueryRow(
		ctx,
		`SELECT customer_id FROM customers WHERE customer_id = $1`,
		input.CustomerID,
	).Scan(&customerID)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("customer not found")
		}
		return nil, err
	}

	// Lock product row to prevent concurrent overselling.
	var productID int32
	var price float64
	var stock int32

	err = tx.QueryRow(
		ctx,
		`SELECT product_id, price, stock_quantity
		 FROM products
		 WHERE product_id = $1
		 FOR UPDATE`,
		input.ProductID,
	).Scan(&productID, &price, &stock)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("product not found")
		}
		return nil, err
	}

	if stock < input.Quantity {
		return nil, fmt.Errorf(
			"insufficient stock: available %d, requested %d",
			stock,
			input.Quantity,
		)
	}

	totalAmount := price * float64(input.Quantity)

	// Deduct stock.
	_, err = tx.Exec(
		ctx,
		`UPDATE products
		 SET stock_quantity = stock_quantity - $1
		 WHERE product_id = $2`,
		input.Quantity,
		input.ProductID,
	)

	if err != nil {
		return nil, err
	}

	// Insert order.
	order := &CreatedOrder{}

	err = tx.QueryRow(
		ctx,
		`INSERT INTO orders
		 (customer_id, product_id, quantity, total_amount, order_status)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING order_id, customer_id, product_id,
		 quantity, total_amount, order_status`,
		input.CustomerID,
		input.ProductID,
		input.Quantity,
		totalAmount,
		"pending",
	).Scan(
		&order.OrderID,
		&order.CustomerID,
		&order.ProductID,
		&order.Quantity,
		&order.TotalAmount,
		&order.OrderStatus,
	)

	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return order, nil
}

// GetAllOrders retrieves all orders.
func (s *OrderService) GetAllOrders(
	ctx context.Context,
) ([]Order, error) {

	rows, err := s.db.Query(
		ctx,
		`SELECT
			order_id,
			customer_id,
			product_id,
			quantity,
			total_amount,
			order_status,
			created_at
		FROM orders
		ORDER BY created_at DESC`,
	)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	orders := make([]Order, 0)

	for rows.Next() {
		var order Order

		err := rows.Scan(
			&order.OrderID,
			&order.CustomerID,
			&order.ProductID,
			&order.Quantity,
			&order.TotalAmount,
			&order.OrderStatus,
			&order.CreatedAt,
		)

		if err != nil {
			return nil, err
		}

		orders = append(orders, order)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return orders, nil
}

// GetOrdersPaginated retrieves orders with pagination.
func (s *OrderService) GetOrdersPaginated(
	ctx context.Context,
	page int,
	limit int,
) ([]Order, int64, error) {

	if page < 1 {
		page = 1
	}

	if limit < 1 {
		limit = 10
	}

	if limit > 100 {
		limit = 100
	}

	offset := (page - 1) * limit

	var total int64

	err := s.db.QueryRow(
		ctx,
		`SELECT COUNT(*) FROM orders`,
	).Scan(&total)

	if err != nil {
		return nil, 0, err
	}

	rows, err := s.db.Query(
		ctx,
		`SELECT
			order_id,
			customer_id,
			product_id,
			quantity,
			total_amount,
			order_status,
			created_at
		FROM orders
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2`,
		limit,
		offset,
	)

	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	orders := make([]Order, 0)

	for rows.Next() {
		var order Order

		err := rows.Scan(
			&order.OrderID,
			&order.CustomerID,
			&order.ProductID,
			&order.Quantity,
			&order.TotalAmount,
			&order.OrderStatus,
			&order.CreatedAt,
		)

		if err != nil {
			return nil, 0, err
		}

		orders = append(orders, order)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return orders, total, nil
}

func (s *OrderService) UpdateOrderStatus(
	ctx context.Context,
	orderID int32,
	status string,
) (*Order, error) {

	status = strings.ToLower(strings.TrimSpace(status))

	switch status {
	case "pending", "processing", "completed":
		// Valid status
	default:
		return nil, errors.New(
			"invalid status: use pending, processing, or completed",
		)
	}

	if orderID <= 0 {
		return nil, errors.New("invalid order ID")
	}

	var order Order

	err := s.db.QueryRow(
		ctx,
		`UPDATE orders
         SET order_status = $1
         WHERE order_id = $2
         RETURNING
            order_id,
            customer_id,
            product_id,
            quantity,
            total_amount,
            order_status,
            created_at`,
		status,
		orderID,
	).Scan(
		&order.OrderID,
		&order.CustomerID,
		&order.ProductID,
		&order.Quantity,
		&order.TotalAmount,
		&order.OrderStatus,
		&order.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("order not found")
		}
		return nil, err
	}

	return &order, nil
}
