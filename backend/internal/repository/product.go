package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ProductRepository struct {
	queries *Queries
}

func NewProductRepository(db *pgxpool.Pool) *ProductRepository {
	return &ProductRepository{
		queries: New(db),
	}
}

func (r *ProductRepository) GetProducts(ctx context.Context) ([]Product, error) {
	return r.queries.GetProducts(ctx)
}

func (r *ProductRepository) GetProductByID(ctx context.Context, id int32) (Product, error) {
	return r.queries.GetProductByID(ctx, id)
}

func (r *ProductRepository) CreateProduct(
	ctx context.Context,
	arg CreateProductParams,
) (Product, error) {
	return r.queries.CreateProduct(ctx, arg)
}

func (r *ProductRepository) UpdateProduct(
	ctx context.Context,
	arg UpdateProductParams,
) (Product, error) {
	return r.queries.UpdateProduct(ctx, arg)
}
