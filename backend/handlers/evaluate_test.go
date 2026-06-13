package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestEvaluateHandler_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	router.POST("/api/evaluate", EvaluateHandler)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/evaluate", bytes.NewBuffer([]byte(`{invalid json}`)))
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestEvaluateHandler_NoAPIKey(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	router.POST("/api/evaluate", EvaluateHandler)

	payload := EvaluateRequest{
		Transcript:       "test",
		OutlineStructure: []string{"test"},
		PacingMetrics:    150,
		HedgingCount:     0,
	}
	body, _ := json.Marshal(payload)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/evaluate", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	// Since we don't have an API key set in the env or headers, we expect a 500 error
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}
