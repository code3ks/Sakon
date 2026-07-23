# Docker Deployment Guide for Reviewers

This guide shows how to run Sakon ABU using **pre-built Docker images** - no installation or project setup required!

## Quick Start for Reviewers (Recommended)

**One command to run everything:**

```bash
# Download the pre-built image and start
curl -o docker-compose.yml https://raw.githubusercontent.com/code3ks/Sakon/main/docker-compose.prebuilt.yml
docker-compose up -d

# Pull Gemma 4 model (one-time, ~3-5 minutes)
docker-compose exec ollama ollama pull gemma4:e2b

# View logs (optional)
docker-compose logs -f sakon-app
```

**Access the app:**
- Frontend: http://localhost:3002
- Backend: http://localhost:8080

**Stop the app:**
```bash
docker-compose down
```

---

## Prerequisites

- **Docker Desktop** or **Docker Engine + Docker Compose**
  - Windows: [Install Docker Desktop](https://docs.docker.com/desktop/install/windows-install/)
  - Mac: [Install Docker Desktop](https://docs.docker.com/desktop/install/mac-install/)
  - Linux: [Install Docker Engine](https://docs.docker.com/engine/install/)

- **System Requirements:**
  - 8GB RAM minimum (for Gemma 4)
  - 10GB free disk space (for Docker images + model)
  - Internet connection (for initial download only)

---

## Two Deployment Options

### Option 1: Pre-built Image (Fastest - Recommended for Reviewers)

Uses the published image from GitHub Container Registry - **no build time required**.

```bash
# 1. Download docker-compose.prebuilt.yml
curl -o docker-compose.yml https://raw.githubusercontent.com/code3ks/Sakon/main/docker-compose.prebuilt.yml

# Or manually download from:
# https://github.com/code3ks/Sakon/blob/main/docker-compose.prebuilt.yml

# 2. Start containers
docker-compose up -d

# 3. Pull Gemma 4 model inside Ollama container
docker-compose exec ollama ollama pull gemma4:e2b

# 4. Access the app
# Frontend: http://localhost:3002
# Backend: http://localhost:8080
```

**First time startup timeline:**
- Pulling images: ~2-3 minutes
- Downloading Gemma 4: ~3-5 minutes
- **Total: ~5-8 minutes**

### Option 2: Build from Source

Build the Docker image from source code (useful for development).

```bash
# 1. Clone the repository
git clone https://github.com/code3ks/Sakon.git
cd Sakon

# 2. Build and start containers
docker-compose up -d

# 3. Pull Gemma 4 model
docker-compose exec ollama ollama pull gemma4:e2b

# 4. Access the app
# Frontend: http://localhost:3002
# Backend: http://localhost:8080
```

**First time startup timeline:**
- Building image: ~5-7 minutes
- Downloading Gemma 4: ~3-5 minutes
- **Total: ~8-12 minutes**

---

## Verifying the Setup

### Check Container Status
```bash
docker-compose ps
```

Expected output:
```
NAME            IMAGE                   STATUS          PORTS
sakon-abu       ghcr.io/code3ks/sakon   Up 2 minutes    0.0.0.0:3002->3002/tcp, 0.0.0.0:8080->8080/tcp
sakon-ollama    ollama/ollama:latest    Up 2 minutes    0.0.0.0:11434->11434/tcp
```

### Check Gemma 4 is Available
```bash
docker-compose exec ollama ollama list
```

Expected output:
```
NAME           ID              SIZE      MODIFIED
gemma4:e2b     abc123def456    2.5 GB    2 minutes ago
```

### Check Backend Health
```bash
curl http://localhost:8080/api/health
```

Expected: `{"status":"ok"}`

### Check Frontend
Open http://localhost:3002 in your browser - you should see the Sakon ABU chat interface.

---

## Using the App

1. **Open** http://localhost:3002
2. **Type a message** like: "I need to defer my exam"
3. **Answer questions** from the AI assistant
4. **Get your letter** - professionally formatted and ready to use

### Sample Conversation

```
You: I need to defer my exam
Bot: I can help you request an exam deferral. Please provide:
     1. Your name, matric number, and department
     2. Which exam/course do you need to defer?
     3. What is the reason for the deferral?

You: Sadiq Muhammed, U19AM1025, Automotive Engineering, 
     ATEN 234, I will not be in Zaria on that day, 500 level

Bot: I need a few more details to draft your exam deferral letter:
     1. What date is the exam you need to defer?

You: july 24, 2026

Bot: I've drafted your letter! Please review it in the preview pane.
     You can copy it, download it, or send it via email.
```

---

## Accessing the Pre-built Image

The Docker image is automatically built and published to GitHub Container Registry when code is pushed to the main branch.

**Image Location:**
```
ghcr.io/code3ks/sakon:latest
```

**Manual pull (optional):**
```bash
docker pull ghcr.io/code3ks/sakon:latest
```

**Available tags:**
- `latest` - Latest stable build from main branch
- `main` - Alias for latest
- `v1.0.0` - Specific version (if tagged)
- `sha-abc123` - Specific commit

---

## Managing the Deployment

### View Logs
```bash
# All services
docker-compose logs -f

# Just the app
docker-compose logs -f sakon-app

# Just Ollama
docker-compose logs -f ollama
```

### Restart Services
```bash
# Restart everything
docker-compose restart

# Restart just the app
docker-compose restart sakon-app
```

### Stop Services
```bash
# Stop but keep containers
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (clears database)
docker-compose down -v
```

### Update to Latest Version
```bash
# Pull latest image
docker-compose pull

# Restart with new image
docker-compose up -d
```

---

## Troubleshooting

### Port Already in Use
If ports 3002 or 8080 are already in use:

```yaml
# Edit docker-compose.yml and change port mappings:
ports:
  - "3003:3002"  # Use 3003 instead of 3002
  - "8081:8080"  # Use 8081 instead of 8080
```

Then restart: `docker-compose up -d`

### Gemma 4 Not Responding
```bash
# Check Ollama is running
docker-compose exec ollama ollama list

# Restart Ollama
docker-compose restart ollama

# Pull model again
docker-compose exec ollama ollama pull gemma4:e2b
```

### App Not Starting
```bash
# View logs for errors
docker-compose logs sakon-app

# Common fixes:
# 1. Ensure Ollama is healthy
docker-compose ps ollama

# 2. Restart the app
docker-compose restart sakon-app

# 3. Rebuild from scratch
docker-compose down
docker-compose up -d
```

### Out of Memory
If you have less than 8GB RAM:

```yaml
# Edit docker-compose.yml - reduce Ollama memory limit:
deploy:
  resources:
    limits:
      memory: 4G  # Changed from 8G
```

Or use a smaller model:
```bash
docker-compose exec ollama ollama pull gemma:2b
```

### Image Not Found (Pre-built)
If `ghcr.io/code3ks/sakon:latest` is not available yet:

1. The GitHub Actions workflow needs to run first
2. Use Option 2 (build from source) instead
3. Or wait ~5-10 minutes for the image to publish after push to main

---

## For Hackathon Judges

### Quickest Demo Path

**Copy-paste this into your terminal:**

```bash
# Create a demo directory
mkdir sakon-demo && cd sakon-demo

# Download docker-compose file
curl -o docker-compose.yml https://raw.githubusercontent.com/code3ks/Sakon/main/docker-compose.prebuilt.yml

# Start everything
docker-compose up -d

# Pull Gemma 4 (grab coffee - takes ~3-5 minutes)
docker-compose exec ollama ollama pull gemma4:e2b

# Open in browser
echo "Ready! Open http://localhost:3002"
```

**Total time: ~5-8 minutes**

### What to Test

1. ✅ Chat with the AI - try "I need to defer my exam"
2. ✅ Check function calls in the sidebar
3. ✅ Review the generated letter
4. ✅ Test offline queue (toggle "Offline Mode")
5. ✅ Download/copy the letter

### Clean Up After Demo

```bash
docker-compose down -v
cd .. && rm -rf sakon-demo
```

---

## Production Deployment (Optional)

For actual production use (e.g., deploying to a server for ABU students):

### Cloud Platforms

**AWS ECS:**
```bash
# Push image to ECR
docker tag ghcr.io/code3ks/sakon:latest <your-ecr-repo>
docker push <your-ecr-repo>

# Deploy via ECS task definition
```

**Google Cloud Run:**
```bash
# Deploy from GitHub Container Registry
gcloud run deploy sakon-abu \
  --image ghcr.io/code3ks/sakon:latest \
  --platform managed \
  --memory 8Gi
```

**DigitalOcean App Platform:**
- Connect GitHub repo
- Select Dockerfile deployment
- Set memory to 8GB
- Deploy

### Environment Variables

For production, set these in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - PORT=8080
  - OLLAMA_URL=http://ollama:11434
  - DATABASE_PATH=/app/backend/sakon.db
```

---

## Security Notes

⚠️ **For Hackathon Demo:**
- Default setup is fine for local testing
- No authentication required

⚠️ **For Production:**
- Add authentication (JWT or OAuth)
- Use HTTPS (reverse proxy with Nginx + Let's Encrypt)
- Set up proper CORS policies
- Enable rate limiting
- Secure database with encryption

---

## GitHub Container Registry Details

**Making Images Public:**

By default, GitHub Container Registry images are private. To make them public (for easier reviewer access):

1. Go to: https://github.com/users/code3ks/packages/container/sakon
2. Click **"Package settings"**
3. Scroll to **"Danger Zone"**
4. Click **"Change visibility"** → **"Public"**

This allows anyone to pull the image without authentication.

---

**Questions?** See the main [README.md](./README.md) or [CODESPACES.md](./CODESPACES.md) for alternative deployment options.
