package store

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// seedPath points at the curated curriculum seed relative to this package.
const seedPath = "../data/lessons_seed.json"

// frontendLinkedLessons are lesson IDs the React app deep-links to (Outliner
// templates, Drills "Learn the concept", and Dashboard recommendations). Each
// must exist in the seed or the UI shows a "Lesson not found" error.
var frontendLinkedLessons = []string{
	"lesson-dehedging",                // Dashboard hedging recommendation
	"lesson-rule-of-three",            // Outliner: Vision-Strategy-Execution
	"lesson-problem-solution-benefit", // Outliner: Problem-Solution-Benefit
	"lesson-filler-words",             // Dashboard filler recommendation
}

func loadSeedForTest(t *testing.T) SeedPayload {
	t.Helper()
	payload, err := LoadSeedFile(seedPath)
	require.NoError(t, err, "seed file must load and parse")
	return payload
}

func TestSeedIntegrity_EveryLessonReferencesExistingModule(t *testing.T) {
	payload := loadSeedForTest(t)

	moduleIDs := make(map[string]bool, len(payload.Modules))
	for _, m := range payload.Modules {
		moduleIDs[m.ID] = true
	}

	for _, lesson := range payload.Lessons {
		assert.Truef(t, moduleIDs[lesson.ModuleID],
			"lesson %q references unknown module %q", lesson.ID, lesson.ModuleID)
	}
}

func TestSeedIntegrity_LessonPositionsUniquePerModule(t *testing.T) {
	payload := loadSeedForTest(t)

	seen := make(map[string]bool) // key: moduleID|position
	for _, lesson := range payload.Lessons {
		key := fmt.Sprintf("%s|%d", lesson.ModuleID, lesson.Position)
		assert.Falsef(t, seen[key],
			"duplicate position %d in module %q (lesson %q)", lesson.Position, lesson.ModuleID, lesson.ID)
		seen[key] = true
	}
}

func TestSeedIntegrity_LessonIDsUnique(t *testing.T) {
	payload := loadSeedForTest(t)

	seen := make(map[string]bool, len(payload.Lessons))
	for _, lesson := range payload.Lessons {
		assert.Falsef(t, seen[lesson.ID], "duplicate lesson id %q", lesson.ID)
		seen[lesson.ID] = true
	}
}

func TestSeedIntegrity_FrontendLinkedLessonsExist(t *testing.T) {
	payload := loadSeedForTest(t)

	lessonIDs := make(map[string]bool, len(payload.Lessons))
	for _, lesson := range payload.Lessons {
		lessonIDs[lesson.ID] = true
	}

	for _, id := range frontendLinkedLessons {
		assert.Truef(t, lessonIDs[id],
			"lesson %q is linked from the frontend but missing from the seed", id)
	}
}

func TestSeedIntegrity_LessonsHaveRequiredContent(t *testing.T) {
	payload := loadSeedForTest(t)

	for _, lesson := range payload.Lessons {
		assert.NotEmptyf(t, lesson.Title, "lesson %q missing title", lesson.ID)
		assert.NotEmptyf(t, lesson.Summary, "lesson %q missing summary", lesson.ID)
		assert.NotEmptyf(t, lesson.Body.Blocks, "lesson %q has no teaching blocks", lesson.ID)
		assert.NotEmptyf(t, lesson.Body.Takeaways, "lesson %q has no takeaways", lesson.ID)
	}
}
