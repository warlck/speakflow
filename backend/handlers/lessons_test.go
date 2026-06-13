package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"speakflow-api/store"
)

func newTestLessonStore(t *testing.T) store.Store {
	t.Helper()
	dbPath := filepath.Join(t.TempDir(), "lessons_api_test.db")
	s, err := store.NewSQLite(dbPath)
	require.NoError(t, err)
	require.NoError(t, s.Migrate())
	t.Cleanup(func() { _ = s.Close() })

	modules := []store.Module{
		{ID: "m1", Title: "Module 1", Description: "Desc 1", Position: 1},
		{ID: "m2", Title: "Module 2", Description: "Desc 2", Position: 2},
	}
	lessons := []store.Lesson{
		{ID: "l1", ModuleID: "m1", Title: "Lesson 1", Summary: "S1", EstimatedMinutes: 10, Body: store.LessonBody{Takeaways: []string{"A"}}, Position: 1},
		{ID: "l2", ModuleID: "m2", Title: "Lesson 2", Summary: "S2", EstimatedMinutes: 12, Body: store.LessonBody{Takeaways: []string{"B"}}, Position: 1},
	}
	require.NoError(t, s.UpsertCurriculum(modules, lessons))
	return s
}

func newLessonRouter(t *testing.T, st LessonStore) *gin.Engine {
	t.Helper()
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	RegisterLessonRoutes(r.Group("/api"), st)
	return r
}

func TestGetModules(t *testing.T) {
	router := newLessonRouter(t, newTestLessonStore(t))

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/api/modules", nil)
	router.ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code)

	var modules []store.Module
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &modules))
	require.Len(t, modules, 2)
	assert.Equal(t, "m1", modules[0].ID)
	require.Len(t, modules[0].Lessons, 1)
	assert.Equal(t, "l1", modules[0].Lessons[0].ID)
}

func TestGetLessons_FilterByModuleID(t *testing.T) {
	router := newLessonRouter(t, newTestLessonStore(t))

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/api/lessons?moduleId=m2", nil)
	router.ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code)

	var lessons []store.Lesson
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &lessons))
	require.Len(t, lessons, 1)
	assert.Equal(t, "l2", lessons[0].ID)
}

func TestGetLessonByID_NotFound(t *testing.T) {
	router := newLessonRouter(t, newTestLessonStore(t))

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/api/lessons/missing", nil)
	router.ServeHTTP(w, req)

	require.Equal(t, http.StatusNotFound, w.Code)
}

func TestPostLesson_InvalidJSON(t *testing.T) {
	router := newLessonRouter(t, newTestLessonStore(t))

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/api/lessons", bytes.NewBufferString("{bad json}"))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	require.Equal(t, http.StatusBadRequest, w.Code)
}

func TestPostLesson_PersistsLesson(t *testing.T) {
	st := newTestLessonStore(t)
	router := newLessonRouter(t, st)

	lesson := store.Lesson{ID: "l3", ModuleID: "m1", Title: "Lesson 3", Summary: "S3", EstimatedMinutes: 7, Body: store.LessonBody{Takeaways: []string{"C"}}, Position: 2}
	body, _ := json.Marshal(lesson)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/api/lessons", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	require.Equal(t, http.StatusCreated, w.Code)

	saved, err := st.GetLessonByID("l3")
	require.NoError(t, err)
	assert.Equal(t, "Lesson 3", saved.Title)
}
