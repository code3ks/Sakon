# 🚀 Reviewer Quick Start Guide

**3 ways to test Sakon ABU in under 10 minutes**

---

## Option 1: GitHub Codespaces (Easiest - No Install)

**Best for:** Quick testing, accessing from any device

```bash
# 1. Open GitHub Codespaces
Visit: https://github.com/code3ks/Sakon
Click: Code → Codespaces → Create codespace on main

# 2. In the Codespace terminal:
chmod +x .devcontainer/setup-codespaces.sh
./.devcontainer/setup-codespaces.sh

# 3. Start the app
npm start

# 4. Make port 3002 public in the Ports tab
# 5. Copy the public URL and test in your browser
```

**Time:** ~8 minutes (includes Gemma 4 download)

---

## Option 2: Pre-built Docker (Fastest Local Setup)

**Best for:** Testing locally with minimal setup

```bash
# 1. Download and start
curl -o docker-compose.yml https://raw.githubusercontent.com/code3ks/Sakon/main/docker-compose.prebuilt.yml
docker-compose up -d

# 2. Pull Gemma 4 model
docker-compose exec ollama ollama pull gemma4:e2b

# 3. Open in browser
http://localhost:3002
```

**Time:** ~5-8 minutes  
**Requires:** Docker Desktop ([install here](https://docs.docker.com/get-docker/))

---

## Option 3: Automated Script (Full Local Setup)

**Best for:** Testing on local machine without Docker

### Windows:
```powershell
git clone https://github.com/code3ks/Sakon.git
cd Sakon
.\setup.ps1
```

### Linux/Mac:
```bash
git clone https://github.com/code3ks/Sakon.git
cd Sakon
chmod +x setup.sh
./setup.sh
```

**Time:** ~5-10 minutes  
**Requires:** Node.js 18+ and Ollama ([install links](./README.md#option-1-automated-setup-recommended))

---

## What to Test

Once the app is running, try these scenarios:

### 1. Basic Chat Flow
```
Type: "I need to defer my exam"
→ Answer the AI's questions
→ Review the generated letter
```

### 2. Function Calling (Check Sidebar)
Watch the **Function Call Log** panel on the right showing:
- `classify_letter_type()` - Determines letter type
- `fill_template()` - Populates the template
- `check_register()` - Validates formal tone

### 3. Offline Queue
- Toggle **"Offline Mode"** in header
- Generate a letter and try to send
- See it queue with "⏳ Pending"
- Toggle back to **"Online"**
- Watch it auto-send

### 4. Letter Types
Try different scenarios:
- "My roommate is causing problems" → **Hostel Complaint**
- "I need to defer my MTH 205 exam" → **Exam Deferral**
- "I need a transcript for my master's application" → **Transcript Request**
- "I can't pay my school fees" → **Bursary Appeal**
- "I missed course registration deadline" → **Registration Issue**

---

## Stopping the App

### Codespaces:
- Just close the browser tab (auto-stops after 30 min)

### Docker:
```bash
docker-compose down
```

### Local Setup:
- Press `Ctrl+C` in the terminal

---

## Troubleshooting

### "Port already in use"
**Docker:** Change ports in `docker-compose.yml` (3003:3002, 8081:8080)  
**Local:** Stop other apps using ports 3002 or 8080

### "Gemma not responding"
```bash
# Docker
docker-compose restart ollama
docker-compose exec ollama ollama pull gemma4:e2b

# Local
ollama serve
ollama pull gemma4:e2b
```

### "Out of memory"
- Requires 8GB RAM for Gemma 4
- Or use smaller model: `ollama pull gemma:2b`

---

## Quick Reference

| Method | Time | Pros | Cons |
|--------|------|------|------|
| **Codespaces** | ~8 min | No install, public URL | Requires GitHub account |
| **Docker** | ~5-8 min | Fast, isolated | Requires Docker Desktop |
| **Local Setup** | ~5-10 min | Full control | More dependencies |

---

## Architecture Overview

```
User Input (Chat)
    ↓
Gemma 4 (via Ollama) - Conversational AI
    ↓
Function Calls:
  • classify_letter_type() - Identifies letter type
  • fill_template() - Populates formal template
  • check_register() - Validates academic tone
    ↓
Formatted Letter (Download/Email)
    ↓
Offline Queue (if no internet)
```

**Tech Stack:**
- Frontend: React + Vite
- Backend: Node.js + Express
- AI: Gemma 4 via Ollama (local, offline)
- Database: SQLite

---

## Key Features to Highlight

✅ **Fully Offline** - Works without internet after initial setup  
✅ **Function Calling** - Real agentic behavior (visible in UI)  
✅ **Register Correction** - Enforces formal Nigerian academic style  
✅ **Offline Queue** - Stores letters when disconnected  
✅ **5 Letter Types** - Covers common student needs  

---

## Project Context

**Hackathon:** Build With Gemma: GDG on Campus ABU Zaria  
**Track:** Civic & Campus Life  
**Problem:** ABU students need formal letters but lack templates and reliable connectivity  
**Solution:** AI assistant that drafts letters locally using Gemma 4  

---

## Links

- 📚 **Full Documentation:** [README.md](./README.md)
- 📝 **Kaggle Writeup:** [KAGGLE_WRITEUP.md](./KAGGLE_WRITEUP.md)
- 💻 **GitHub Repo:** https://github.com/code3ks/Sakon

---

**Questions?** Open an issue on GitHub or check the troubleshooting sections in the full guides.

**Time to test: < 10 minutes** ⏱️
