package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/siddheshRajendraNimbalkar/AirflowEcommerce/backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type CustomerHandler struct {
	service *service.CustomerService
}

func NewCustomerHandler(s *service.CustomerService) *CustomerHandler {
	return &CustomerHandler{service: s}
}

func (h *CustomerHandler) GetCustomers(c *gin.Context) {
	customers, err := h.service.GetCustomers(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve customers",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": customers,
	})
}

func (h *CustomerHandler) GetCustomerByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 32)

	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	customer, err := h.service.GetCustomerByID(
		c.Request.Context(),
		int32(id),
	)

	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve customer",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": customer})
}
