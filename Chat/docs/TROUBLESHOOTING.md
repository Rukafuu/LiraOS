# 🛠️ LiraOS Troubleshooting Guide

This guide covers common issues and solutions for Early Access users.

---

## 🔴 Backend Won't Start

### Symptom

```
Error: Cannot find module 'express'
```

or port already in use.

### Solutions

**1. Missing Dependencies**

```bash
cd backend
npm install
```

**2. Port 4000 Already in Use**

**Windows:**

```powershell
# Find what's using port 4000
netstat -ano | findstr :4000

# Kill it (replace PID with actual number)
taskkill /PID 12345 /F
```

**Mac/Linux:**

```bash
# Find and kill
lsof -ti:4000 | xargs kill -9
```

**3. Permission Issues**
Run terminal as Administrator (Windows) or use `sudo` (Mac/Linux).

---

## 🎤 XTTS Voice Server Issues

### Symptom

Voice doesn't work, or you see "Local voice unavailable" warning.

### Is XTTS Required?

**No!** LiraOS automatically falls back to Google TTS if XTTS is offline.

### Why Might XTTS Fail?

**1. No NVIDIA GPU**
XTTS requires CUDA. If you don't have an NVIDIA GPU:

- **Solution:** Just use Google TTS (automatic fallback)
- Or use ElevenLabs (add API key to `.env`)

**2. Not Enough VRAM**
XTTS needs ~4GB VRAM.

Check your GPU:

```bash
nvidia-smi
```

If VRAM is low:

- Close other GPU apps (games, video editing)
- Or disable XTTS and use Google TTS

**3. Python Package Installation Failed**

```bash
cd backend/tts
pip install --upgrade pip
pip install -r requirements.txt
```

If still fails, install PyTorch manually:

```bash
# For CUDA 11.8
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**4. XTTS Server Crashed**

Check logs in the XTTS terminal window. Common errors:

- `CUDA out of memory` → Not enough VRAM
- `Module not found` → Re-run `pip install -r requirements.txt`

---

## 🌐 Frontend Issues

### Blank Screen / Won't Load

**1. Clear Browser Cache**

- Press `Ctrl+Shift+Delete` (Windows/Linux)
- Or `Cmd+Shift+Delete` (Mac)
- Clear cache and refresh

**2. Check if Backend is Running**
Open: `http://localhost:4000/health`

Should return JSON. If not, backend isn't running.

**3. Port 5173 in Use**

```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5173 | xargs kill -9
```

---

## 💬 Chat Not Working

### "Failed to connect to Mistral API"

**Cause:** Missing or invalid API key.

**Solution:**

1. Check `backend/.env`
2. Make sure `MISTRAL_API_KEY` has a real value (not `your_mistral_key_here`)
3. Verify key at: [console.mistral.ai](https://console.mistral.ai)

**Fallback:**
Add `OPENROUTER_API_KEY` to `.env` for automatic failover.

### Chat Freezes / No Response

**1. Check Backend Logs**
Look at the terminal running `server.js`. Do you see errors?

**2. API Key Quota Exceeded**
Check your Mistral/OpenRouter dashboard. You might be out of credits.

---

## 🗣️ Voice Recognition Not Working

### Microphone Not Detected

**Windows:**

1. Settings → Privacy → Microphone
2. Allow browser to access microphone

**Mac:**

1. System Preferences → Security & Privacy → Microphone
2. Check your browser

**Browser:**

1. Click the lock icon in address bar
2. Allow microphone access

### Recognition Stuck on "Listening..."

**Solution:**

- Refresh the page (`F5`)
- Try a different microphone (Settings → Voice → Microphone)

---

## 📊 Export Logs for Support

If you can't solve the problem:

1. Click the **pink feedback button** (bottom-right)
2. Click **"Export Logs"**
3. Send the downloaded file to support or attach to GitHub issue

Logs include:

- System info (Node version, OS, memory)
- Error messages
- Backend health status

**Note:** Logs do NOT contain your API keys or personal data.

---

## 🧪 Advanced Debugging

### Check All Services Manually

**Backend:**

```bash
curl http://localhost:4000/health
```

Expected response:

```json
{ "status": "ok", "services": { "backend": "online" } }
```

**XTTS:**

```bash
curl http://localhost:5002/health
```

Expected: `{"status":"ok"}` or `{"error":"..."}` if offline.

**Frontend:**
Open browser dev tools (`F12`) → Console tab.
Look for red error messages.

---

## 🆘 Still Stuck?

1. **GitHub Issues:** [github.com/yourrepo/issues](https://github.com)
2. **Discord:** [Join server](https://discord.gg/...)
3. **Email:** support@liraos.dev

Include:

- OS and version (Windows 11, macOS Ventura, Ubuntu 22.04, etc.)
- Node and Python versions (`node --version`, `python --version`)
- Exported logs (from feedback button)
- Screenshot of error

---

**Most issues are solved within 24 hours. Thanks for being an Early Access tester! 🙏**
