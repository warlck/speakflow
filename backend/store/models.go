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

// LessonBody holds the structured, teachable content of a lesson. It is stored
// as a JSON document in the lessons.body column so the schema can evolve
// without database migrations.
type LessonBody struct {
	Blocks    []LessonBlock `json:"blocks"`
	Examples  []Example     `json:"examples"`
	Takeaways []string      `json:"takeaways"`
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
