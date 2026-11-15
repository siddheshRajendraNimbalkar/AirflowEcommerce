package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/siddheshRajendraNimbalkar/AirflowEcommerce/backend/internal/service"
)

type AnalyticsHandler struct {
	service *service.AnalyticsService
}

func NewAnalyticsHandler(s *service.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{service: s}
}

func (h *AnalyticsHandler) GetOverview(c *gin.Context) {
	data, err := h.service.GetOverview(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

func (h *AnalyticsHandler) GetDailySales(c *gin.Context) {
	data, err := h.service.GetDailySales(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

func (h *AnalyticsHandler) GetTopProducts(c *gin.Context) {
	data, err := h.service.GetTopProducts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}