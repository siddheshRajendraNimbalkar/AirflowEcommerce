package service

import (
	"context"

	"github.com/siddheshRajendraNimbalkar/AirflowEcommerce/backend/internal/repository"
)

type ProductService struct {
	repo *repository.ProductRepository
}

func NewProductService(repo *repository.ProductRepository) *ProductService {
	return &ProductService{repo: repo}
}

func (s *ProductService) GetProducts(ctx context.Context) ([]repository.Product, error) {
	return s.repo.GetProducts(ctx)
}

func (s *ProductService) GetProductByID(
	ctx context.Context,
	id int32,
) (repository.Product, error) {
	return s.repo.GetProductByID(ctx, id)
}
