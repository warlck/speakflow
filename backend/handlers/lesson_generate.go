package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"

	"speakflow-api/store"
)

type LessonGenerateRequest struct {
	Topic      string `json:"topic"`
	ModuleID   string `json:"moduleId,omitempty"`
	Audience   string `json:"audience,omitempty"`
	Difficulty string `json:"difficulty,omitempty"`
}

type LessonGenerateResponse struct {
	Draft store.Lesson `json:"draft"`
}

// LessonGenerateHandler drafts a lesson with AI in the lessons.body schema and
// returns it for review. It does not auto-publish; saving a draft goes through
// the same admin upsert (POST /api/lessons) as curated content.
func LessonGenerateHandler(c *gin.Context) {
	var req LessonGenerateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	apiKey := resolveGeminiAPIKey(c)
	if apiKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "API key not configured"})
		return
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		log.Printf("Error creating GenAI client: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize AI client"})
		return
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-3.5-flash")
	model.SystemInstruction = &genai.Content{
		Parts: []genai.Part{
			genai.Text(`You design executive public speaking lessons. Return JSON only with keys:
id, moduleId, title, summary, estimatedMinutes (int), body, relatedDrill, practicePrompt, position (int).
body is an object with: blocks (array of {heading, text}), examples (array of {before, after, note}), takeaways (array of strings), and links (array of {title, url}).
For links, generate 2-3 real or high-quality illustrative external resources (e.g. Harvard Business Review, Toastmasters, TED, YouTube) with specific titles and URLs for further reading/listening/watching.
Keep it practical, concise, and actionable. Do NOT wrap in markdown backticks.`),
		},
	}

	prompt := fmt.Sprintf(
		"Topic: %s\nModule ID hint: %s\nAudience: %s\nDifficulty: %s\nGenerate a production-ready lesson draft.",
		req.Topic, req.ModuleID, req.Audience, req.Difficulty,
	)

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		log.Printf("Error generating lesson draft: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate lesson draft"})
		return
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No response from AI"})
		return
	}

	textPart, ok := resp.Candidates[0].Content.Parts[0].(genai.Text)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid response format from AI"})
		return
	}

	var draft store.Lesson
	if err := json.Unmarshal([]byte(textPart), &draft); err != nil {
		log.Printf("Error parsing lesson generation response: %v, raw: %s", err, textPart)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse generated lesson"})
		return
	}

	if draft.ID == "" {
		draft.ID = "lesson-" + slugify(req.Topic)
	}
	if draft.ModuleID == "" {
		draft.ModuleID = req.ModuleID
	}
	if draft.EstimatedMinutes == 0 {
		draft.EstimatedMinutes = 10
	}
	if draft.Position == 0 {
		draft.Position = 1
	}

	c.JSON(http.StatusOK, LessonGenerateResponse{Draft: draft})
}

var slugStrip = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(input string) string {
	normalized := slugStrip.ReplaceAllString(strings.ToLower(strings.TrimSpace(input)), "-")
	normalized = strings.Trim(normalized, "-")
	if normalized == "" {
		return "draft"
	}
	return normalized
}
