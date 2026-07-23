#!/bin/bash

# Sakon ABU - Complete Setup Script
# This script installs all dependencies, sets up Ollama, pulls Gemma 4, and starts the application

set -e  # Exit on error

echo "=================================="
echo "Sakon ABU - Setup Starting"
echo "=================================="

# Check Node.js version
echo "[1/7] Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "ERROR: Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi
echo "Node.js version: $(node -v) - OK"

# Install npm dependencies
echo ""
echo "[2/7] Installing npm dependencies..."
npm install
echo "Dependencies installed successfully"

# Check if Ollama is installed
echo ""
echo "[3/7] Checking Ollama installation..."
if ! command -v ollama &> /dev/null; then
    echo "WARNING: Ollama is not installed."
    echo "Please install Ollama from: https://ollama.ai/download"
    echo "After installation, run this script again."
    exit 1
fi
echo "Ollama is installed - OK"

# Start Ollama service
echo ""
echo "[4/7] Starting Ollama service..."
ollama serve > /dev/null 2>&1 &
OLLAMA_PID=$!
sleep 3
echo "Ollama service started (PID: $OLLAMA_PID)"

# Check if Gemma 4 model is available
echo ""
echo "[5/7] Checking for Gemma 4 model..."
if ! ollama list | grep -q "gemma4:e2b"; then
    echo "Gemma 4 E2B not found. Pulling model (this may take several minutes)..."
    ollama pull gemma4:e2b
    echo "Gemma 4 E2B downloaded successfully"
else
    echo "Gemma 4 E2B already available - OK"
fi

# Initialize database
echo ""
echo "[6/7] Initializing database..."
mkdir -p backend
echo "Database directory created"

# Start the application
echo ""
echo "[7/7] Starting Sakon ABU..."
echo ""
echo "=================================="
echo "Setup Complete!"
echo "=================================="
echo ""
echo "Frontend: http://localhost:3002"
echo "Backend:  http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

npm start
