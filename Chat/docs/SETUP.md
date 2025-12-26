# 🚀 LiraOS Setup Guide (Early Access v0.9)

Welcome to the LiraOS Early Access program! This guide will get you up and running in minutes.

## ✅ Prerequisites

Before you start, make sure you have:

- **Node.js** 18 or higher ([Download](https://nodejs.org))
- **Python** 3.10 or higher ([Download](https://python.org))
- **Git** ([Download](https://git-scm.com))
- **(Optional)** NVIDIA GPU with CUDA for local voice (XTTS)

Quick check:

```bash
node --version  # Should show v18+ or v20+
python --version  # Should show 3.10+
git --version
```

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/liraos
cd liraos
```

### 2. Install Dependencies

**Frontend:**

```bash
npm install
```

**Backend:**

```bash
cd backend
npm install
```

**XTTS Voice Server (Optional):**

```bash
cd backend/tts
pip install -r requirements.txt
```

> ⚠️ **Note:** XTTS requires ~4GB VRAM. If you don't have a GPU, LiraOS will automatically fallback to Google TTS (works perfectly fine).

---

## ⚙️ Configuration

### 1. Create Environment File

Copy the example file:

```bash
cd backend
copy .env.example .env  # Windows
# OR
cp .env.example .env    # Mac/Linux
```

### 2. Add Your API Keys

Open `backend/.env` and fill in:

```env
# Required (for AI chat)
MISTRAL_API_KEY=your_mistral_key_here

# Optional (fallback model)
OPENROUTER_API_KEY=your_openrouter_key_here

# Optional (premium voice - ElevenLabs)
ELEVENLABS_API_KEY=your_elevenlabs_key_here

# Optional (email password reset)
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

**Where to get API keys:**

- **Mistral:** [console.mistral.ai](https://console.mistral.ai) (Free $5 credit)
- **OpenRouter:** [openrouter.ai](https://openrouter.ai) (Pay-as-you-go)
- **ElevenLabs:** [elevenlabs.io](https://elevenlabs.io) (Optional, 10k free chars/month)

---

## 🎯 Starting LiraOS

### Windows

Double-click:

```
start_all.bat
```

Or from terminal:

```bash
start_all.bat
```

### Mac/Linux

```bash
chmod +x start_all.sh
./start_all.sh
```

### What Happens:

1. **Backend** starts on `http://localhost:4000`
2. **XTTS Voice** (optional) starts on `http://localhost:5002`
3. **Frontend** starts on `http://localhost:5173`

Your browser should automatically open `http://localhost:5173`.

---

## ✅ Verify Everything Works

### 1. Check Health Status

Open: `http://localhost:4000/health`

You should see:

```json
{
  "status": "ok",
  "mode": "desktop-early-access",
  "version": "0.9.0-beta",
  "services": {
    "backend": "online",
    "database": "sqlite",
    "xtts": "online" or "offline"
  }
}
```

> If `xtts` shows `"offline"`, that's OK! LiraOS will use Google TTS automatically.

### 2. Test Chat

1. Open LiraOS (`http://localhost:5173`)
2. Send a message: "Hello Lira!"
3. You should get a response within 2-3 seconds

### 3. Test Voice (Optional)

1. Click the microphone icon
2. Say something
3. Lira should respond with voice

If voice fails see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## 🔧 Common Issues

| Problem                  | Quick Fix                                         |
| ------------------------ | ------------------------------------------------- |
| `npm install` fails      | Delete `node_modules` and try again               |
| Port 4000 already in use | Kill the process: `netstat -ano \| findstr :4000` |
| Python packages fail     | Try: `pip install --upgrade pip` first            |
| XTTS crashes             | Reduce VRAM usage or disable in settings          |

For detailed troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## 🐛 Reporting Issues

Found a bug? Click the **pink feedback button** (bottom-right) in LiraOS and select "Bug".

Or create an issue on GitHub with:

- What you were trying to do
- What went wrong
- Your system info (click "Export Logs" button)

---

## 📚 Next Steps

- Read [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed help
- Join our Discord: [link-here]
- Check the wiki for advanced features

---

**Enjoy LiraOS! 🤖✨**

_Made with ❤️ by the LiraOS team_
