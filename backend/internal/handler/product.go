package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/siddheshRajendraNimbalkar/AirflowEcommerce/backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type ProductHandler struct {
	service *service.ProductService
}

func NewProductHandler(s *service.ProductService) *ProductHandler {
	return &ProductHandler{service: s}
}

func (h *ProductHandler) GetProducts(c *gin.Context) {
	products, err := h.service.GetProducts(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve products",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": products,
	})
}

func (h *ProductHandler) GetProductByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 32)

	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	product, err := h.service.GetProductByID(
		c.Request.Context(),
		int32(id),
	)

	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve product",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": product})
}
