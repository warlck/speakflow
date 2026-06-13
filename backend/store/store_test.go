package store

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newTestStore(t *testing.T) Store {
	t.Helper()
	dbPath := filepath.Join(t.TempDir(), "speakflow_test.db")
	s, err := NewSQLite(dbPath)
	require.NoError(t, err)
	require.NoError(t, s.Migrate())
	t.Cleanup(func() { _ = s.Close() })
	return s
}

func sampleCurriculum() ([]Module, []Lesson) {
	modules := []Module{
		{ID: "mod-conviction", Title: "Speak with Conviction", Description: "Clarity under pressure", Position: 1},
	}
	lessons := []Lesson{
		{
			ID:               "lesson-dehedging",
			ModuleID:         "mod-conviction",
			Title:            "De-Hedging Essentials",
			Summary:          "Replace soft language with confident phrasing.",
			EstimatedMinutes: 12,
			Body: LessonBody{
				Blocks:    []LessonBlock{{Heading: "Why hedging hurts", Text: "It dilutes authority."}},
				Examples:  []Example{{Before: "I think we might revisit this.", After: "We will revisit this now.", Note: "Ownership."}},
				Takeaways: []string{"State conclusions directly.", "Avoid stacked qualifiers."},
			},
			RelatedDrill:   "dehedging",
			PracticePrompt: "Reframe a recommendation decisively.",
			Position:       1,
		},
	}
	return modules, lessons
}

func TestSQLiteStore_UpsertCurriculum_IsIdempotent(t *testing.T) {
	s := newTestStore(t)
	modules, lessons := sampleCurriculum()

	require.NoError(t, s.UpsertCurriculum(modules, lessons))
	require.NoError(t, s.UpsertCurriculum(modules, lessons))

	gotModules, err := s.ListModules()
	require.NoError(t, err)
	require.Len(t, gotModules, 1)
	assert.Equal(t, "mod-conviction", gotModules[0].ID)

	gotLessons, err := s.ListLessons("")
	require.NoError(t, err)
	require.Len(t, gotLessons, 1)
	assert.Equal(t, "lesson-dehedging", gotLessons[0].ID)
	assert.Equal(t, "dehedging", gotLessons[0].RelatedDrill)
	assert.Len(t, gotLessons[0].Body.Takeaways, 2)
}

func TestSQLiteStore_ListLessons_FilterByModuleID(t *testing.T) {
	s := newTestStore(t)
	modules := []Module{
		{ID: "m1", Title: "Module One", Description: "One", Position: 1},
		{ID: "m2", Title: "Module Two", Description: "Two", Position: 2},
	}
	lessons := []Lesson{
		{ID: "l1", ModuleID: "m1", Title: "Lesson One", Summary: "One", EstimatedMinutes: 8, Body: LessonBody{Takeaways: []string{"One"}}, Position: 1},
		{ID: "l2", ModuleID: "m2", Title: "Lesson Two", Summary: "Two", EstimatedMinutes: 9, Body: LessonBody{Takeaways: []string{"Two"}}, Position: 1},
	}
	require.NoError(t, s.UpsertCurriculum(modules, lessons))

	filtered, err := s.ListLessons("m2")
	require.NoError(t, err)
	require.Len(t, filtered, 1)
	assert.Equal(t, "l2", filtered[0].ID)
}

func TestSQLiteStore_GetLessonByID_NotFound(t *testing.T) {
	s := newTestStore(t)
	_, err := s.GetLessonByID("missing")
	require.Error(t, err)
	assert.ErrorIs(t, err, ErrLessonNotFound)
}

func TestSeed_LoadAndIdempotentUpsert(t *testing.T) {
	s := newTestStore(t)

	seedJSON := `{
		"modules": [{"id": "mod-structure", "title": "Structure", "description": "Organize", "position": 1}],
		"lessons": [{
			"id": "lesson-rule3", "moduleId": "mod-structure", "title": "Rule of Three",
			"summary": "Parallel triads", "estimatedMinutes": 11,
			"body": {"blocks": [{"heading": "Why", "text": "Recall"}], "examples": [], "takeaways": ["Parallelism"]},
			"relatedDrill": "rule3", "practicePrompt": "Three points.", "position": 1
		}]
	}`
	seedPath := filepath.Join(t.TempDir(), "seed.json")
	require.NoError(t, os.WriteFile(seedPath, []byte(seedJSON), 0o644))

	loaded, err := LoadSeedFile(seedPath)
	require.NoError(t, err)
	require.Len(t, loaded.Lessons, 1)

	require.NoError(t, Seed(s, seedPath))
	require.NoError(t, Seed(s, seedPath))

	modules, err := s.ListModules()
	require.NoError(t, err)
	require.Len(t, modules, 1)

	lessons, err := s.ListLessons("")
	require.NoError(t, err)
	require.Len(t, lessons, 1)
	assert.Equal(t, "lesson-rule3", lessons[0].ID)
}
