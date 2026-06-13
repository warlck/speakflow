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

func TestCoachHandler_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	router.POST("/api/coach", CoachHandler)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/api/coach", bytes.NewBufferString("{bad json}"))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestCoachHandler_NoAPIKey(t *testing.T) {
	t.Setenv("GEMINI_API_KEY", "")
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	router.POST("/api/coach", CoachHandler)

	body, _ := json.Marshal(CoachRequest{ConceptKey: "dehedging", Scenario: "Quarterly update", Transcript: "I think we might delay."})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/api/coach", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestLessonGenerateHandler_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	router.POST("/api/lessons/generate", LessonGenerateHandler)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/api/lessons/generate", bytes.NewBufferString("{bad json}"))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestLessonGenerateHandler_NoAPIKey(t *testing.T) {
	t.Setenv("GEMINI_API_KEY", "")
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	router.POST("/api/lessons/generate", LessonGenerateHandler)

	body, _ := json.Marshal(LessonGenerateRequest{Topic: "Storytelling", ModuleID: "mod-structure-and-rhetoric"})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/api/lessons/generate", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestSlugify(t *testing.T) {
	assert.Equal(t, "executive-storytelling", slugify("  Executive   Storytelling!! "))
	assert.Equal(t, "draft", slugify("   "))
}
