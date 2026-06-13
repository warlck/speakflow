package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type CoachRequest struct {
	ConceptKey string `json:"conceptKey"`
	Scenario   string `json:"scenario"`
	Transcript string `json:"transcript"`
}

type CoachResponse struct {
	Feedback         string   `json:"feedback"`
	AppliedConcept   string   `json:"appliedConcept"`
	SuggestedRewrite string   `json:"suggestedRewrite"`
	Tips             []string `json:"tips"`
}

// CoachHandler returns concept-specific coaching for a spoken attempt, teaching
// the user how to apply a concept rather than just scoring them.
func CoachHandler(c *gin.Context) {
	var req CoachRequest
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
			genai.Text(`You are an executive speaking coach. Return JSON only with keys:
feedback (string), appliedConcept (string), suggestedRewrite (string), tips (array of strings).
Give actionable, concise coaching tied to the requested concept. Do NOT wrap in markdown backticks.`),
		},
	}

	prompt := fmt.Sprintf("Concept: %s\nScenario: %s\nTranscript:\n%s\nReturn valid JSON only.", req.ConceptKey, req.Scenario, req.Transcript)

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		log.Printf("Error generating coaching: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate coaching"})
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

	var coachResp CoachResponse
	if err := json.Unmarshal([]byte(textPart), &coachResp); err != nil {
		log.Printf("Error parsing coaching response: %v, raw: %s", err, textPart)
		coachResp = CoachResponse{
			Feedback:       "Could not parse AI coaching response. Try a shorter transcript and retry.",
			AppliedConcept: req.ConceptKey,
			Tips: []string{
				"Use one direct recommendation sentence.",
				"Trim qualifiers like 'maybe' and 'I think'.",
				"End with a clear ask.",
			},
		}
	}

	c.JSON(http.StatusOK, coachResp)
}
