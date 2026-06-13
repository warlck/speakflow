package store

import (
	"encoding/json"
	"fmt"
	"os"
)

// SeedPayload is the on-disk shape of the curated curriculum seed file.
type SeedPayload struct {
	Modules []Module `json:"modules"`
	Lessons []Lesson `json:"lessons"`
}

// LoadSeedFile reads and parses a curriculum seed file.
func LoadSeedFile(path string) (SeedPayload, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return SeedPayload{}, fmt.Errorf("read seed file: %w", err)
	}

	var payload SeedPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		return SeedPayload{}, fmt.Errorf("parse seed json: %w", err)
	}

	return payload, nil
}

// Seed loads a curriculum seed file and upserts it into any Store
// implementation. It is database-agnostic (operating only through the Store
// interface) and idempotent, so it is safe to run on every startup.
func Seed(s Store, path string) error {
	payload, err := LoadSeedFile(path)
	if err != nil {
		return err
	}

	if err := s.UpsertCurriculum(payload.Modules, payload.Lessons); err != nil {
		return fmt.Errorf("upsert seed curriculum: %w", err)
	}

	return nil
}
