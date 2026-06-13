.PHONY: help setup run run-frontend run-backend stop test test-frontend test-backend build build-frontend build-backend

help:
	@echo "SpeakFlow Commands:"
	@echo "  make setup          - Install all dependencies (Frontend and Backend)"
	@echo "  make run            - Run both frontend and backend concurrently (requires GEMINI_API_KEY)"
	@echo "  make run-frontend   - Run Vite React development server only"
	@echo "  make run-backend    - Run Go backend server only"
	@echo "  make stop           - Stop any running frontend and backend servers cleanly"
	@echo "  make test           - Run both frontend and backend tests"
	@echo "  make test-frontend  - Run frontend Vitest suite"
	@echo "  make test-backend   - Run backend Go tests"
	@echo "  make build          - Build both components for production"
	@echo "  make build-frontend - Compile React production assets"
	@echo "  make build-backend  - Compile Go backend binary"

setup:
	@echo "=== Setting up SpeakFlow ==="
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Downloading backend modules..."
	cd backend && go mod download
	@echo "Setup complete."

run-frontend:
	cd frontend && npm run dev

run-backend:
	@if [ -z "$$GEMINI_API_KEY" ]; then \
		echo "\033[33m[Warning] GEMINI_API_KEY is not set in the environment.\033[0m"; \
	fi
	cd backend && go run main.go

run:
	@echo "=== Starting Full Application ==="
	npx --yes concurrently --kill-others --names "backend,frontend" --prefix-colors "cyan,magenta" "make run-backend" "make run-frontend"

stop:
	@echo "=== Stopping SpeakFlow Servers ==="
	@echo "Stopping backend on port 8080..."
	@lsof -t -i :8080 | xargs kill -9 2>/dev/null || true
	@echo "Stopping frontend on port 5173..."
	@lsof -t -i :5173 | xargs kill -9 2>/dev/null || true
	@echo "Stopped."

test-frontend:
	cd frontend && npm run test

test-backend:
	cd backend && go test ./...

test: test-backend test-frontend

build-frontend:
	cd frontend && npm run build

build-backend:
	cd backend && go build ./...

build: build-backend build-frontend
