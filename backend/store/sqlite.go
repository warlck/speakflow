package store

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

// sqliteStore is the SQLite-backed implementation of Store. It is intentionally
// unexported so callers depend on the Store interface rather than a
// database-specific type, keeping the backend replaceable.
type sqliteStore struct {
	db *sql.DB
}

// NewSQLite opens (creating if needed) a SQLite-backed Store at dbPath and
// returns it as the database-agnostic Store interface.
func NewSQLite(dbPath string) (Store, error) {
	if dbPath == "" {
		return nil, errors.New("db path is required")
	}

	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return nil, fmt.Errorf("create db directory: %w", err)
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("open sqlite db: %w", err)
	}

	if _, err := db.Exec("PRAGMA foreign_keys = ON;"); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("enable foreign keys: %w", err)
	}

	return &sqliteStore{db: db}, nil
}

func (s *sqliteStore) Close() error {
	return s.db.Close()
}

func (s *sqliteStore) Migrate() error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS modules (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			position INTEGER NOT NULL DEFAULT 0
		);`,
		`CREATE TABLE IF NOT EXISTS lessons (
			id TEXT PRIMARY KEY,
			module_id TEXT NOT NULL,
			title TEXT NOT NULL,
			summary TEXT NOT NULL,
			estimated_minutes INTEGER NOT NULL,
			body TEXT NOT NULL,
			related_drill TEXT,
			practice_prompt TEXT,
			position INTEGER NOT NULL DEFAULT 0,
			updated_at TEXT NOT NULL DEFAULT (datetime('now')),
			FOREIGN KEY(module_id) REFERENCES modules(id) ON DELETE CASCADE
		);`,
		`CREATE INDEX IF NOT EXISTS idx_lessons_module_position ON lessons(module_id, position);`,
	}

	for _, stmt := range stmts {
		if _, err := s.db.Exec(stmt); err != nil {
			return fmt.Errorf("run migration statement: %w", err)
		}
	}

	return nil
}

func (s *sqliteStore) UpsertCurriculum(modules []Module, lessons []Lesson) error {
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("begin upsert curriculum tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	for _, m := range modules {
		if _, err := tx.Exec(
			`INSERT INTO modules (id, title, description, position)
			 VALUES (?, ?, ?, ?)
			 ON CONFLICT(id) DO UPDATE SET
			   title = excluded.title,
			   description = excluded.description,
			   position = excluded.position`,
			m.ID, m.Title, m.Description, m.Position,
		); err != nil {
			return fmt.Errorf("upsert module %s: %w", m.ID, err)
		}
	}

	for _, l := range lessons {
		if err := upsertLessonTx(tx, l); err != nil {
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit upsert curriculum tx: %w", err)
	}

	return nil
}

func (s *sqliteStore) UpsertLesson(lesson Lesson) error {
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("begin upsert lesson tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := upsertLessonTx(tx, lesson); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit upsert lesson tx: %w", err)
	}

	return nil
}

func upsertLessonTx(tx *sql.Tx, lesson Lesson) error {
	body, err := json.Marshal(lesson.Body)
	if err != nil {
		return fmt.Errorf("marshal lesson body for %s: %w", lesson.ID, err)
	}

	if _, err := tx.Exec(
		`INSERT INTO lessons (
			id, module_id, title, summary, estimated_minutes, body, related_drill, practice_prompt, position, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
		ON CONFLICT(id) DO UPDATE SET
			module_id = excluded.module_id,
			title = excluded.title,
			summary = excluded.summary,
			estimated_minutes = excluded.estimated_minutes,
			body = excluded.body,
			related_drill = excluded.related_drill,
			practice_prompt = excluded.practice_prompt,
			position = excluded.position,
			updated_at = datetime('now')`,
		lesson.ID,
		lesson.ModuleID,
		lesson.Title,
		lesson.Summary,
		lesson.EstimatedMinutes,
		string(body),
		lesson.RelatedDrill,
		lesson.PracticePrompt,
		lesson.Position,
	); err != nil {
		return fmt.Errorf("upsert lesson %s: %w", lesson.ID, err)
	}

	return nil
}

func (s *sqliteStore) ListModules() ([]Module, error) {
	rows, err := s.db.Query(`SELECT id, title, description, position FROM modules ORDER BY position ASC, id ASC`)
	if err != nil {
		return nil, fmt.Errorf("list modules query: %w", err)
	}
	defer rows.Close()

	modules := make([]Module, 0)
	for rows.Next() {
		var m Module
		if err := rows.Scan(&m.ID, &m.Title, &m.Description, &m.Position); err != nil {
			return nil, fmt.Errorf("scan module row: %w", err)
		}
		modules = append(modules, m)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate module rows: %w", err)
	}

	return modules, nil
}

func (s *sqliteStore) ListLessons(moduleID string) ([]Lesson, error) {
	query := `SELECT id, module_id, title, summary, estimated_minutes, body, related_drill, practice_prompt, position, updated_at FROM lessons`
	args := make([]any, 0)
	if moduleID != "" {
		query += ` WHERE module_id = ?`
		args = append(args, moduleID)
	}
	query += ` ORDER BY position ASC, id ASC`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("list lessons query: %w", err)
	}
	defer rows.Close()

	lessons := make([]Lesson, 0)
	for rows.Next() {
		lesson, err := scanLesson(rows)
		if err != nil {
			return nil, err
		}
		lessons = append(lessons, lesson)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate lesson rows: %w", err)
	}

	return lessons, nil
}

func (s *sqliteStore) GetLessonByID(id string) (Lesson, error) {
	row := s.db.QueryRow(
		`SELECT id, module_id, title, summary, estimated_minutes, body, related_drill, practice_prompt, position, updated_at
		 FROM lessons WHERE id = ?`,
		id,
	)

	lesson, err := scanLesson(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Lesson{}, ErrLessonNotFound
		}
		return Lesson{}, err
	}

	return lesson, nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanLesson(scanner rowScanner) (Lesson, error) {
	var lesson Lesson
	var bodyRaw string
	if err := scanner.Scan(
		&lesson.ID,
		&lesson.ModuleID,
		&lesson.Title,
		&lesson.Summary,
		&lesson.EstimatedMinutes,
		&bodyRaw,
		&lesson.RelatedDrill,
		&lesson.PracticePrompt,
		&lesson.Position,
		&lesson.UpdatedAt,
	); err != nil {
		return Lesson{}, err
	}

	if err := json.Unmarshal([]byte(bodyRaw), &lesson.Body); err != nil {
		return Lesson{}, fmt.Errorf("unmarshal lesson body for %s: %w", lesson.ID, err)
	}

	return lesson, nil
}
