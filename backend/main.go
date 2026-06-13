package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"speakflow-api/handlers"
	"speakflow-api/store"
)

func main() {
	dbPath := os.Getenv("LESSON_DB_PATH")
	if dbPath == "" {
		dbPath = "data/speakflow.db"
	}

	// NewSQLite returns the database-agnostic store.Store; swap this single line
	// for another backend (e.g. NewPostgres) without touching handlers.
	lessonStore, err := store.NewSQLite(dbPath)
	if err != nil {
		log.Fatalf("failed to initialize lesson store: %v", err)
	}
	defer func() {
		if cerr := lessonStore.Close(); cerr != nil {
			log.Printf("failed to close lesson store: %v", cerr)
		}
	}()

	if err := lessonStore.Migrate(); err != nil {
		log.Fatalf("failed to run lesson store migrations: %v", err)
	}

	seedPath := os.Getenv("LESSON_SEED_PATH")
	if seedPath == "" {
		seedPath = "data/lessons_seed.json"
	}
	if err := store.Seed(lessonStore, seedPath); err != nil {
		log.Fatalf("failed to seed lessons: %v", err)
	}

	r := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173"}
	config.AllowMethods = []string{"GET", "POST", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "X-API-Key"}
	r.Use(cors.New(config))

	// Routes
	api := r.Group("/api")
	{
		api.POST("/evaluate", handlers.EvaluateHandler)
		api.POST("/coach", handlers.CoachHandler)
		api.POST("/lessons/generate", handlers.LessonGenerateHandler)
		handlers.RegisterLessonRoutes(api, lessonStore)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server listening on port %s", port)
	r.Run(":" + port)
}
