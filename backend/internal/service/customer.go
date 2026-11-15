package service

import (
	"context"

	"github.com/siddheshRajendraNimbalkar/AirflowEcommerce/backend/internal/repository"
)

type CustomerService struct {
	repo *repository.CustomerRepository
}

func NewCustomerService(repo *repository.CustomerRepository) *CustomerService {
	return &CustomerService{repo: repo}
}

func (s *CustomerService) GetCustomers(ctx context.Context) ([]repository.Customer, error) {
	return s.repo.GetCustomers(ctx)
}

func (s *CustomerService) GetCustomerByID(
	ctx context.Context,
	id int32,
) (repository.Customer, error) {
	return s.repo.GetCustomerByID(ctx, id)
}
