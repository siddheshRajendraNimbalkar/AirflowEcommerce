package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CustomerRepository struct {
	queries *Queries
}

func NewCustomerRepository(db *pgxpool.Pool) *CustomerRepository {
	return &CustomerRepository{
		queries: New(db),
	}
}

func (r *CustomerRepository) GetCustomers(ctx context.Context) ([]Customer, error) {
	return r.queries.GetCustomers(ctx)
}

func (r *CustomerRepository) GetCustomerByID(ctx context.Context, id int32) (Customer, error) {
	return r.queries.GetCustomerByID(ctx, id)
}

func (r *CustomerRepository) CreateCustomer(
	ctx context.Context,
	arg CreateCustomerParams,
) (Customer, error) {
	return r.queries.CreateCustomer(ctx, arg)
}

func (r *CustomerRepository) UpdateCustomer(
	ctx context.Context,
	arg UpdateCustomerParams,
) (Customer, error) {
	return r.queries.UpdateCustomer(ctx, arg)
}
