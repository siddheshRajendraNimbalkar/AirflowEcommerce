package service

import (
    "context"

    "github.com/siddheshRajendraNimbalkar/AirflowEcommerce/backend/internal/repository"
)

type AnalyticsService struct {
    repo *repository.AnalyticsRepository
}

func NewAnalyticsService(repo *repository.AnalyticsRepository) *AnalyticsService {
    return &AnalyticsService{repo: repo}
}

func (s *AnalyticsService) GetOverview(ctx context.Context) (repository.GetSalesOverviewRow, error) {
    return s.repo.GetSalesOverview(ctx)
}

func (s *AnalyticsService) GetDailySales(ctx context.Context) ([]repository.GetDailySalesRow, error) {
    return s.repo.GetDailySales(ctx)
}

func (s *AnalyticsService) GetTopProducts(ctx context.Context) ([]repository.GetTopProductsRow, error) {
    return s.repo.GetTopProducts(ctx)
}