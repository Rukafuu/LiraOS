# Lira Project Implementation Plan & Status

## ✅ Completed Milestones (JARVIS Era)

- [x] **PC Controller (Lira Link)**: Full remote control via PowerShell (Open Apps, Media, Shutdown).
- [x] **Vision System**: Real-time screen analysis using Gemini Flash 2.0.
- [x] **Proactive Agency**: `agentBrain.js` that autonomously decides when to speak/suggest based on context.
- [x] **Wake Word**: Local "Lira tá aí?" detection in Frontend.
- [x] **File Organizer**: "Organize Downloads" command implemented in `lira-link`.
- [x] **Gamer Companion Foundation**: Transitioned from inputs-bot to vision-assistant architecture.

---

## 🚀 Phase 4: The JARVIS Dashboard & Self-Evolution (The Moonshot)

### 1. The JARVIS Dashboard (Visual Interface)

**Goal:** Create a dedicate "God Mode" UI that looks like a sci-fi command center.

- **Visuals:** Dark mode, holographic elements, cyan/purple accent graphs.
- **Widgets:**
  - **Live Vision Feed:** Show what Lira is seeing (pixelated/matrix style for aesthetics).
  - **System Vitals:** CPU, RAM, Network usage (needs `systeminformation` in `lira-link`).
  - **Brain Activity:** Visualizer showing when Gemini is "thinking" vs "listening".
  - **Active Modules:** Status of installed tools (Spotify, Cleaner, etc).

### 2. Self-Evolution Module (The "Trae" Integration)

**Goal:** Enable Lira to write and improve her own backend code securely.

- **Tools:** Give Lira ability to `read_backend_file` and `generate_git_patch`.
- **Workflow:**
  1. User request: "Refactor the logging system."
  2. Lira thinks & generates a Diff.
  3. **Human Review Modal:** A specialized UI to view "Before vs After".
  4. **Approval:** User clicks "Apply Evolution".
  5. **Hot Reload:** Backend restarts with new code.
- **Safety:** Hard-coded restrictions on critical auth/env files.

### 3. Advanced Gamer Companion

**Goal:** A "Second Brain" for gaming.

- **Overlay:** A transparent, click-through overlay on top of games.
- **Context Awareness:**
  - _Minecraft:_ Coord tracking, recipe book lookup.
  - _Strategy Games:_ Economy warnings ("You need more gold").
  - _RPGs:_ Quest log memorization.

---

## 🛠 Next Immediate Steps

1. **Initialize Tauri** infrastructure (`src-tauri`).
2. **Build Web Frontend** correctly.
3. **Verify Rust Environment** (cargo check).

## 🖥️ Phase 5: Lira Desktop (The Tauri Twin)

**Goal:** Create a high-performance, low-RAM native executable while keeping the Web version active.

- **Technology:** Tauri v2 (Rust + React).
- **Strategy:**
  - Wrap existing React Frontend in Tauri Webview.
  - Re-implement `lira-link.js` logic (screenshots, shell commands) in Rust/Tauri for native speed.
  - Distribute as `.msi` or `.exe` installer.
- **Benefits:**
  - ~50-100MB RAM usage (vs 400MB+ Web).
  - Global Hotkeys (Alt+Space to summon Lira).
  - System Tray icon.
