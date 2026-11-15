package handler

import (
	"net/http"
	"log"

	"github.com/siddheshRajendraNimbalkar/AirflowEcommerce/backend/internal/airflow"

	"github.com/gin-gonic/gin"
)

type AirflowHandler struct {
	client *airflow.Client
}

func NewAirflowHandler(client *airflow.Client) *AirflowHandler {
	return &AirflowHandler{client: client}
}

func (h *AirflowHandler) GetDAGs(c *gin.Context) {
	result, err := h.client.ListDAGs(c.Request.Context())
	if err != nil {
		log.Printf("[AIRFLOW ERROR] GetDAGs: %v", err)
		c.JSON(http.StatusBadGateway, gin.H{
			"status":  "error",
			"message": "Could not retrieve DAGs from Airflow",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"count":  result.TotalEntries,
		"data":   result.DAGs,
	})
}

func (h *AirflowHandler) GetDAGRuns(c *gin.Context) {
	dagID := c.Param("dag_id")

	if dagID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "dag_id is required",
		})
		return
	}

	result, err := h.client.ListDAGRuns(
		c.Request.Context(),
		dagID,
	)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"status":  "error",
			"message": "Could not retrieve DAG runs from Airflow",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"count":  result.TotalEntries,
		"data":   result.DAGRuns,
	})
}
