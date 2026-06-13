package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"speakflow-api/handlers"
)

func main() {
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
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server listening on port %s", port)
	r.Run(":" + port)
}
