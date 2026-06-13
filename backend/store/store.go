package store

import "errors"

// ErrLessonNotFound is returned when a lesson lookup finds no matching record.
var ErrLessonNotFound = errors.New("lesson not found")

// Store is the database-agnostic persistence contract for curriculum content.
//
// Callers (HTTP handlers, seeding, main) depend only on this interface, never on
// a concrete database type. That keeps the storage backend replaceable: the
// current implementation is SQLite (see NewSQLite), but a future backend such as
// Postgres can satisfy the same interface and be swapped in at the composition
// root without touching callers.
type Store interface {
	// Migrate ensures the schema exists and is up to date.
	Migrate() error
	// Close releases underlying resources (connections, files).
	Close() error

	// UpsertCurriculum inserts or updates modules and lessons atomically.
	UpsertCurriculum(modules []Module, lessons []Lesson) error
	// UpsertLesson inserts or updates a single lesson by id.
	UpsertLesson(lesson Lesson) error

	// ListModules returns modules ordered by position.
	ListModules() ([]Module, error)
	// ListLessons returns lessons ordered by position, optionally filtered by
	// moduleID (empty string returns all lessons).
	ListLessons(moduleID string) ([]Lesson, error)
	// GetLessonByID returns a single lesson or ErrLessonNotFound.
	GetLessonByID(id string) (Lesson, error)
}
