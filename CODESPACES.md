# Running Sakon ABU on GitHub Codespaces

GitHub Codespaces provides a **live development environment with a public URL** that reviewers and users can access directly in their browser.

## Quick Start for Reviewers

1. **Click the Codespaces button** on the GitHub repo page
2. **Wait for environment to build** (~2-3 minutes first time)
3. **Run setup** (only needed once):
   ```bash
   chmod +x .devcontainer/setup-codespaces.sh
   ./.devcontainer/setup-codespaces.sh
   ```
4. **Start the app**:
   ```bash
   npm start
   ```
5. **Access via public URL**: Click the "Ports" tab and make port 3002 public

## Detailed Instructions

### Creating a Codespace

**Option 1: From GitHub Repository**
1. Go to https://github.com/code3ks/Sakon
2. Click the green **"Code"** button
3. Select **"Codespaces"** tab
4. Click **"Create codespace on main"**

**Option 2: Direct Link**
- Share this link with reviewers: `https://github.com/code3ks/Sakon/codespaces`

### First-Time Setup

After the Codespace opens:

```bash
# 1. Run the Codespaces setup script (installs Ollama + Gemma 4)
chmod +x .devcontainer/setup-codespaces.sh
./.devcontainer/setup-codespaces.sh

# Wait for Gemma 4 to download (~3-5 minutes for ~2.5GB model)

# 2. Start the application
npm start
```

### Making the App Publicly Accessible

By default, Codespaces ports are private. To share with reviewers:

1. **Open the Ports panel**: 
   - Click **"PORTS"** tab at the bottom of VS Code
   - Or use: `Ctrl+Shift+P` → "Ports: Focus on Ports View"

2. **Make port 3002 public**:
   - Right-click on port **3002** (Frontend)
   - Select **"Port Visibility"** → **"Public"**

3. **Copy the public URL**:
   - Right-click on port **3002**
   - Select **"Copy Local Address"**
   - Share this URL with reviewers

The URL will look like: `https://username-sakon-xxxxx.github.dev`

### Port Configuration

| Port | Service | Visibility |
|------|---------|------------|
| 3002 | Frontend (React) | Make **Public** for sharing |
| 8080 | Backend API | Private (used internally) |
| 11434 | Ollama | Private (used internally) |

### Verifying Setup

Check that everything is running:

```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Check Gemma 4 is available
ollama list

# Check backend is running
curl http://localhost:8080/api/health

# Check frontend is running
curl http://localhost:3002
```

## Benefits for Hackathon Review

✅ **No local installation** - Reviewers don't need Node.js, Ollama, or any dependencies  
✅ **Consistent environment** - Same setup for all reviewers  
✅ **Public URL** - Easy to share and demo  
✅ **Fast access** - Runs in the cloud, not limited by reviewer's hardware  
✅ **Pre-configured** - All dependencies and ports already set up  

## Using Docker in Codespaces

Alternatively, you can run the Docker setup in Codespaces:

```bash
# Start containers
docker-compose up -d

# Pull Gemma 4 inside Ollama container
docker-compose exec ollama ollama pull gemma4:e2b

# View logs
docker-compose logs -f sakon-app
```

Access at the same public URL after making port 3002 public.

## Limitations

⚠️ **Free tier limits**:
- 120 core-hours/month (15 hours on 8-core machine)
- 15 GB/month storage
- Codespace stops after 30 minutes of inactivity

⚠️ **Performance**:
- Gemma 4 runs on CPU (no GPU in free tier)
- Responses may take 30-60 seconds
- Consider using 4-core or 8-core machine type for better performance

## Tips for Demo Day

1. **Start Codespace 10 minutes before demo** - Ensures everything is running
2. **Keep the terminal open** - Shows the app is actively running
3. **Test the public URL** - Verify it's accessible from another device
4. **Have the repo README open** - For context and architecture diagrams

## Sharing with Judges

**Include this in your Kaggle Writeup:**

> **Live Demo (GitHub Codespaces):**
> 
> 1. Visit: https://github.com/code3ks/Sakon
> 2. Click "Code" → "Codespaces" → "Create codespace on main"
> 3. Run: `chmod +x .devcontainer/setup-codespaces.sh && ./.devcontainer/setup-codespaces.sh`
> 4. Run: `npm start`
> 5. Make port 3002 public in the Ports tab
> 6. Access the live URL
> 
> **Or try our pre-built Docker image:**
> ```bash
> docker-compose up -d
> docker-compose exec ollama ollama pull gemma4:e2b
> ```

## Troubleshooting

**Ollama not responding:**
```bash
# Restart Ollama
pkill ollama
nohup ollama serve > /tmp/ollama.log 2>&1 &
sleep 5
```

**Port not accessible:**
- Ensure port 3002 is set to "Public" in Ports panel
- Try stopping and restarting: `Ctrl+C` then `npm start`

**Gemma 4 too slow:**
- Upgrade Codespace to 4-core or 8-core machine
- Or use a smaller model: `ollama pull gemma:2b`

## Alternative: GitHub Pages (Static Demo)

For a **permanently hosted version** (without AI features):
1. Build static files: `npm run build`
2. Deploy `dist/` folder to GitHub Pages
3. Note: AI features won't work (requires backend + Ollama)

---

**Questions?** Check the main [README.md](./README.md) or open an issue on GitHub.
