package handlers

import (
	"os"

	"github.com/gin-gonic/gin"
)

// resolveGeminiAPIKey returns the Gemini API key from a per-request header if
// present, otherwise from the GEMINI_API_KEY environment variable.
func resolveGeminiAPIKey(c *gin.Context) string {
	if key := c.GetHeader("X-API-Key"); key != "" {
		return key
	}
	return os.Getenv("GEMINI_API_KEY")
}
