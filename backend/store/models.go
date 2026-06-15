package store

// LessonBlock is a single teaching block within a lesson body. Each block
// pairs a short heading with explanatory text so the UI can render scannable,
// well-structured concept explanations.
type LessonBlock struct {
	Heading string `json:"heading"`
	Text    string `json:"text"`
}

// Example is a before/after illustration that shows how applying a concept
// transforms weak phrasing into strong, executive phrasing.
type Example struct {
	Before string `json:"before"`
	After  string `json:"after"`
	Note   string `json:"note,omitempty"`
}

type LessonLink struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

// Video is a reference to a YouTube clip embedded within a lesson.
// WatchFor tells the user what technique to observe in the clip.
type Video struct {
	Title    string `json:"title"`
	YouTubeID string `json:"youtubeId"`
	StartSec int    `json:"startSec,omitempty"`
	EndSec   int    `json:"endSec,omitempty"`
	WatchFor string `json:"watchFor"`
}

// PracticeStep is one step in a guided practice walkthrough within a lesson.
type PracticeStep struct {
	Step        int    `json:"step"`
	Instruction string `json:"instruction"`
	DurationSecs int   `json:"durationSecs,omitempty"`
}

// InlineDrill is a conversational drill scenario embedded within a lesson.
// It provides full context so the user never feels lost about what to say.
type InlineDrill struct {
	ID              string   `json:"id"`
	Title           string   `json:"title"`
	Situation       string   `json:"situation"`
	Background      string   `json:"background"`
	Task            string   `json:"task"`
	StarterPhrase   string   `json:"starterPhrase,omitempty"`
	ModelAnswer     string   `json:"modelAnswer"`
	SuccessCriteria []string `json:"successCriteria"`
	DurationSecs    int      `json:"durationSecs"`
}

// LessonBody holds the structured, teachable content of a lesson. It is stored
// as a JSON document in the lessons.body column so the schema can evolve
// without database migrations.
type LessonBody struct {
	Blocks    []LessonBlock  `json:"blocks"`
	Examples  []Example      `json:"examples"`
	Takeaways []string       `json:"takeaways"`
	Links     []LessonLink   `json:"links,omitempty"`
	Videos    []Video        `json:"videos,omitempty"`
	Steps     []PracticeStep `json:"steps,omitempty"`
	Drills    []InlineDrill  `json:"drills,omitempty"`
}

// Lesson is a single unit of teaching content belonging to a module.
type Lesson struct {
	ID               string     `json:"id"`
	ModuleID         string     `json:"moduleId"`
	Title            string     `json:"title"`
	Summary          string     `json:"summary"`
	EstimatedMinutes int        `json:"estimatedMinutes"`
	Body             LessonBody `json:"body"`
	RelatedDrill     string     `json:"relatedDrill,omitempty"`
	PracticePrompt   string     `json:"practicePrompt,omitempty"`
	Position         int        `json:"position"`
	UpdatedAt        string     `json:"updatedAt,omitempty"`
}

// Module groups related lessons into a coherent learning track. Lessons is
// populated only by endpoints that return the nested curriculum (for example
// GET /api/modules); flat lesson queries leave it nil.
type Module struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Position    int      `json:"position"`
	Lessons     []Lesson `json:"lessons,omitempty"`
}
