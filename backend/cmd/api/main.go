package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/siddheshRajendraNimbalkar/AirflowEcommerce/backend/internal/airflow"
	"github.com/siddheshRajendraNimbalkar/AirflowEcommerce/backend/internal/database"
	"github.com/siddheshRajendraNimbalkar/AirflowEcommerce/backend/internal/handler"
	"github.com/siddheshRajendraNimbalkar/AirflowEcommerce/backend/internal/middleware"
	"github.com/siddheshRajendraNimbalkar/AirflowEcommerce/backend/internal/repository"
	"github.com/siddheshRajendraNimbalkar/AirflowEcommerce/backend/internal/routes"
	"github.com/siddheshRajendraNimbalkar/AirflowEcommerce/backend/internal/service"
)

func main() {
	// Load .env for local development.
	// Docker Compose injects environment variables directly.
	if err := godotenv.Load(".env"); err != nil {
		log.Printf("No .env file found; using environment variables")
	}

	// Database connection
	db, err := database.Connect()
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer db.Close()

	// Airflow client
	airflowClient := airflow.NewClient()
	airflowHandler := handler.NewAirflowHandler(airflowClient)

	// Order dependencies
	orderRepo := repository.NewOrderRepository(db)
	orderService := service.NewOrderService(orderRepo, db)
	orderHandler := handler.NewOrderHandler(orderService)

	// Customer dependencies
	customerRepo := repository.NewCustomerRepository(db)
	customerService := service.NewCustomerService(customerRepo)
	customerHandler := handler.NewCustomerHandler(customerService)

	// Product dependencies
	productRepo := repository.NewProductRepository(db)
	productService := service.NewProductService(productRepo)
	productHandler := handler.NewProductHandler(productService)

	// Analytics dependencies
	analyticsRepo := repository.NewAnalyticsRepository(db)
	analyticsService := service.NewAnalyticsService(analyticsRepo)
	analyticsHandler := handler.NewAnalyticsHandler(analyticsService)

	// Gin router
	router := gin.New()

	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(middleware.CORSMiddleware())
	router.Use(middleware.SecurityMiddleware())

	// Register routes
	routes.RegisterRoutes(router, orderHandler, airflowHandler, customerHandler, productHandler, analyticsHandler)

	// Server configuration
	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8081"
	}

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("Server running on port %s", port)

	// Start HTTP server
	if err := server.ListenAndServe(); err != nil &&
		err != http.ErrServerClosed {
		log.Fatalf("Server failed: %v", err)
	}
}
