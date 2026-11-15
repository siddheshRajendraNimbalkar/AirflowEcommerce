package handler

import (
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/siddheshRajendraNimbalkar/AirflowEcommerce/backend/internal/service"
)

type OrderHandler struct {
	service *service.OrderService
}

func NewOrderHandler(service *service.OrderService) *OrderHandler {
	return &OrderHandler{
		service: service,
	}
}

func (h *OrderHandler) GetAllOrders(c *gin.Context) {
	orders, err := h.service.GetAllOrders(c.Request.Context())

	if err != nil {
		log.Printf("ERROR fetching orders: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to fetch orders",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"count":  len(orders),
		"data":   orders,
	})
}

func (h *OrderHandler) GetOrdersPaginated(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "page must be a positive integer",
		})
		return
	}

	limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if err != nil || limit < 1 || limit > 100 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "limit must be between 1 and 100",
		})
		return
	}

	orders, total, err := h.service.GetOrdersPaginated(
		c.Request.Context(),
		page,
		limit,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to retrieve orders",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
		"count": len(orders),
		"data":  orders,
	})
}

func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var input service.CreateOrderInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid order request",
		})
		return
	}

	order, err := h.service.CreateOrder(c.Request.Context(), input)

	if err != nil {
		switch err.Error() {
		case "customer not found", "product not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Order created successfully",
		"data":    order,
	})
}

type UpdateOrderStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 32)

	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid order ID",
		})
		return
	}

	var request UpdateOrderStatusRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Status is required",
		})
		return
	}

	order, err := h.service.UpdateOrderStatus(
		c.Request.Context(),
		int32(id),
		request.Status,
	)

	if err != nil {
		if err.Error() == "order not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		}

		if err.Error() == "invalid order ID" ||
			strings.HasPrefix(err.Error(), "invalid status:") {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update order status",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Order status updated successfully",
		"data":    order,
	})
}
