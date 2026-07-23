#!/bin/bash

echo "======================================"
echo "Sakon ABU - Codespaces Setup"
echo "======================================"

# Install Ollama
echo ""
echo "[1/3] Installing Ollama..."
curl -fsSL https://ollama.com/install.sh | sh

# Add Ollama to PATH
export PATH="/usr/local/bin:$PATH"

# Start Ollama in background
echo ""
echo "[2/3] Starting Ollama service..."
nohup /usr/local/bin/ollama serve > /tmp/ollama.log 2>&1 &
sleep 5

# Pull Gemma 4 model
echo ""
echo "[3/3] Pulling Gemma 4 model (this may take 5-10 minutes)..."
/usr/local/bin/ollama pull gemma4:e2b

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Run: npm start"
echo ""
