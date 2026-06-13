package handlers

import (
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"speakflow-api/store"
)

// LessonStore is the narrow, consumer-defined persistence surface the HTTP
// handlers need. It is satisfied by any store.Store implementation, so the
// underlying database can be swapped without changing these handlers.
type LessonStore interface {
	ListModules() ([]store.Module, error)
	ListLessons(moduleID string) ([]store.Lesson, error)
	GetLessonByID(id string) (store.Lesson, error)
	UpsertLesson(lesson store.Lesson) error
}

// RegisterLessonRoutes wires curriculum read/write routes onto the API group.
func RegisterLessonRoutes(api *gin.RouterGroup, st LessonStore) {
	api.GET("/modules", getModulesHandler(st))
	api.GET("/lessons", getLessonsHandler(st))
	api.GET("/lessons/:id", getLessonByIDHandler(st))
	api.POST("/lessons", postLessonHandler(st))
}

func getModulesHandler(st LessonStore) gin.HandlerFunc {
	return func(c *gin.Context) {
		modules, err := st.ListModules()
		if err != nil {
			log.Printf("list modules failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch modules"})
			return
		}

		lessons, err := st.ListLessons("")
		if err != nil {
			log.Printf("list lessons for modules failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch modules"})
			return
		}

		byModule := make(map[string][]store.Lesson)
		for _, lesson := range lessons {
			byModule[lesson.ModuleID] = append(byModule[lesson.ModuleID], lesson)
		}
		for i := range modules {
			modules[i].Lessons = byModule[modules[i].ID]
		}

		c.JSON(http.StatusOK, modules)
	}
}

func getLessonsHandler(st LessonStore) gin.HandlerFunc {
	return func(c *gin.Context) {
		lessons, err := st.ListLessons(c.Query("moduleId"))
		if err != nil {
			log.Printf("list lessons failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch lessons"})
			return
		}
		c.JSON(http.StatusOK, lessons)
	}
}

func getLessonByIDHandler(st LessonStore) gin.HandlerFunc {
	return func(c *gin.Context) {
		lesson, err := st.GetLessonByID(c.Param("id"))
		if err != nil {
			if errors.Is(err, store.ErrLessonNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "Lesson not found"})
				return
			}
			log.Printf("get lesson by id failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch lesson"})
			return
		}
		c.JSON(http.StatusOK, lesson)
	}
}

func postLessonHandler(st LessonStore) gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO(auth): restrict this admin endpoint to trusted users before production.
		var lesson store.Lesson
		if err := c.ShouldBindJSON(&lesson); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lesson payload"})
			return
		}

		if err := st.UpsertLesson(lesson); err != nil {
			log.Printf("upsert lesson failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save lesson"})
			return
		}

		c.JSON(http.StatusCreated, lesson)
	}
}
