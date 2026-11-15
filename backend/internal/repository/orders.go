package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type OrderRepository struct {
	queries *Queries
}

func NewOrderRepository(db *pgxpool.Pool) *OrderRepository {
	return &OrderRepository{
		queries: New(db),
	}
}

func (r *OrderRepository) GetAllOrders(ctx context.Context) ([]Order, error) {
	return r.queries.GetAllOrders(ctx)
}

func (r *OrderRepository) GetOrdersPaginated(
	ctx context.Context,
	limit int32,
	offset int32,
) ([]Order, error) {
	return r.queries.GetOrdersPaginated(
		ctx,
		GetOrdersPaginatedParams{
			Limit:  limit,
			Offset: offset,
		},
	)
}
