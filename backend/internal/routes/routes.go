package routes

import (
	"github.com/gin-gonic/gin"

	"github.com/siddheshRajendraNimbalkar/AirflowEcommerce/backend/internal/handler"
)

func RegisterRoutes(
	router *gin.Engine,
	orderHandler *handler.OrderHandler,
	airflowHandler *handler.AirflowHandler,
	customerHandler *handler.CustomerHandler,
	productHandler *handler.ProductHandler,
	analyticsHandler *handler.AnalyticsHandler,
) {
	api := router.Group("/api/v1")

	// Orders
	api.GET("/orders", orderHandler.GetAllOrders)
	api.GET("/orders/paginated", orderHandler.GetOrdersPaginated)
	api.POST("/orders", orderHandler.CreateOrder)

	customers := api.Group("/customers")
	{
		customers.GET("", customerHandler.GetCustomers)
		customers.GET("/:id", customerHandler.GetCustomerByID)
	}

	products := api.Group("/products")
	{
		products.GET("", productHandler.GetProducts)
		products.GET("/:id", productHandler.GetProductByID)
	}

	api.GET("/airflow/dags", airflowHandler.GetDAGs)
	api.GET(
		"/airflow/dags/:dag_id/runs",
		airflowHandler.GetDAGRuns,
	)

	api.PATCH(
		"/orders/:id/status",
		orderHandler.UpdateOrderStatus,
	)

	// Analytics
	analytics := api.Group("/analytics")
	{
		analytics.GET("/overview", analyticsHandler.GetOverview)
		analytics.GET("/revenue", analyticsHandler.GetDailySales)
		analytics.GET("/top-products", analyticsHandler.GetTopProducts)
	}
}
