# 🌌 LiraOS Skill Tiers & Permissions Structure

This document defines the capability levels (Tiers) for LiraOS users, gating advanced Jarvis-like features based on subscription level.

## 🟢 0. Neutron (Free)

**Focus:** Basic Chatbot & Information.

- **Core:** Infinite Chat (LLM Basic Model).
- **Memory:** Session-only (Short-term).
- **Tools:**
  - `search_web` (Basic queries).
  - `list_todos` (View only local lists).
  - `weather` (If implemented).

## 🔵 1. Starlight (Basic Plan)

**Focus:** Personal Assistant.

- **Memory:** Long-term Memory (Vector DB).
- **Voice:** Neural Voice Output (RVC/XTTS).
- **Tools:**
  - `create_calendar_event` (Manage schedule).
  - `add_todo_item` (Persistent To-Do).

## 🟣 2. Supernova (Pro Plan)

**Focus:** Creator & Power User.

- **GenAI:**
  - `generate_image` (Flux/Midjourney).
  - `vision_analysis` (Analyze uploaded images).
- **Tools:**
  - `get_system_stats` (View Dashboard Widgets).
  - `organize_folder` (Documents only).

## ⚫ 3. Singularity (Ultra/Jarvis Plan)

**Focus:** Full System Integration & Automation.

- **Hardware Control:**
  - `execute_media_command` (Play/Pause/Volume).
  - `open_app` (Launch Applications).
  - `screen_vision` (Live Screen Analysis).
- **File System:**
  - `organize_folder` (Full Scope - Downloads, Desktop).

## 👑 4. Quasar (Admin / Owner Only)

**"God Mode" - Dangerous Capabilities.**

- These skills are restricted to the User ID defined in `ADMIN_USER_ID`.
- **Permissions:**
  - `execute_system_command` (Raw Shell / CMD access).
  - `delete_file` (Irreversible deletion).
  - `manage_users` (Ban/Unban users).
  - `system_shutdown` (Turn off PC).

---

### Implementation Guide

To enforce these tiers, add the following check in `chat.js` before `switch(tool.name)`:

```javascript
const MIN_TIER_FOR_TOOL = {
  organize_folder: "SINGULARITY",
  execute_system_command: "QUASAR",
  get_system_stats: "SUPERNOVA",
  generate_image: "SUPERNOVA",
};

const userTier = user.tier || "NEUTRON"; // Fetch from DB
const requiredTier = MIN_TIER_FOR_TOOL[tool.name];

if (requiredTier && !hasTier(userTier, requiredTier)) {
  return { error: `Upgrade to ${requiredTier} to use this skill.` };
}
```
