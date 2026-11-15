package repository

import (
    "context"
)

type AnalyticsRepository struct {
    queries *Queries
}

func NewAnalyticsRepository(db DBTX) *AnalyticsRepository {
    return &AnalyticsRepository{
        queries: New(db),
    }
}

func (r *AnalyticsRepository) GetSalesOverview(ctx context.Context) (GetSalesOverviewRow, error) {
    return r.queries.GetSalesOverview(ctx)
}

func (r *AnalyticsRepository) GetDailySales(ctx context.Context) ([]GetDailySalesRow, error) {
    return r.queries.GetDailySales(ctx)
}

func (r *AnalyticsRepository) GetTopProducts(ctx context.Context) ([]GetTopProductsRow, error) {
    return r.queries.GetTopProducts(ctx)
}