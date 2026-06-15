package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type EvaluateRequest struct {
	Transcript       string   `json:"transcript"`
	OutlineStructure []string `json:"outlineStructure"`
	PacingMetrics    int      `json:"pacingMetrics"`
	HedgingCount     int      `json:"hedgingCount"`
	FillerCount      int      `json:"fillerCount"`
}

type EvaluateResponse struct {
	OverallAssessment string   `json:"overallAssessment"`
	Strengths         []string `json:"strengths"`
	Improvements      []string `json:"improvements"`
	ExecutiveScore    int      `json:"executiveScore"`
}

func EvaluateHandler(c *gin.Context) {
	var req EvaluateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
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
			genai.Text("You are an elite clear-communication and public-speaking coach. Evaluate the transcript across these dimensions:\n1. Clarity: Is the core message easy to follow and free of rambling?\n2. Structure: Logical organization (e.g. BLUF, Rule of Three, clear signposting); did they follow any provided outline?\n3. Audience-awareness: Is it framed for the listener (what's in it for them)?\n4. Confidence & Conviction: Penalize hedging words; reward decisive, declarative phrasing.\n5. Delivery: Pacing (WPM \u2014 ideal ~130-150) and verbal fillers (penalize high filler use such as um/uh/like/you know).\nWeigh strengths and weaknesses fairly and tailor advice to the metrics provided.\nRespond strictly in JSON format with keys: overallAssessment (string), strengths (array of strings), improvements (array of strings), and executiveScore (integer 0-100). Do NOT wrap in markdown backticks."),
		},
	}

	prompt := fmt.Sprintf("Transcript: %s\nOutline: %v\nPacing (WPM): %d\nHedging Count: %d\nFiller Count: %d", req.Transcript, req.OutlineStructure, req.PacingMetrics, req.HedgingCount, req.FillerCount)

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		log.Printf("Error generating content: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to evaluate transcript"})
		return
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No response from AI"})
		return
	}

	var rawResponse string
	if textPart, ok := resp.Candidates[0].Content.Parts[0].(genai.Text); ok {
		rawResponse = string(textPart)
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid response format from AI"})
		return
	}

	var evalResp EvaluateResponse
	if err := json.Unmarshal([]byte(rawResponse), &evalResp); err != nil {
		log.Printf("Error parsing AI response: %v, raw: %s", err, rawResponse)
		// Fallback mock response if parsing fails
		evalResp = EvaluateResponse{
			OverallAssessment: "The AI response could not be parsed into the required format. Ensure the prompt strictly enforces JSON.",
			Strengths:         []string{"Attempted the exercise"},
			Improvements:      []string{"Backend AI parsing error"},
			ExecutiveScore:    0,
		}
	}

	c.JSON(http.StatusOK, evalResp)
}
