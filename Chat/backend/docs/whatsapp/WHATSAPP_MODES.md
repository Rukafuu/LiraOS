# WhatsApp Runtime Modes

Lira's WhatsApp integration supports two distinct runtime modes to balance feature richness with platform compliance.

## 1. Official Mode (`official`)

This mode uses the **WhatsApp Cloud API**. It is fully compliant with Meta's terms of service but has significant limitations regarding passive data collection.

- **Technology:** WhatsApp Cloud API (Webhooks + HTTP).
- **Capabilities:**
  - Respond to user messages when mentioned (`@Lira`).
  - Respond to direct commands (e.g., `/sticker`).
  - Send interactive messages (buttons, lists).
- **Limitations:**
  - **No access to group history:** Lira cannot read messages she isn't tagged in.
  - **No Passive Ranking:** "Top Yap" and activity rankings are impossible because we cannot count messages.
  - **Cost:** Conversations are priced by Meta (Utility/Marketing/Service categories).
- **Use Case:** Enterprise deployments, strict compliance requirements, verified business accounts.

## 2. Experimental Mode (`experimental`)

This mode uses **Baileys** (a WebSocket implementation) to connect as a normal WhatsApp device (like WhatsApp Web).

- **Technology:** Baileys (WebSocket).
- **Capabilities:**
  - **Full Group Visibility:** Lira sees every message in the group.
  - **Activity Ranking:** Enables `/top`, active hours, silence streaks, etc.
  - **Passive Gamification:** XP for every message, hidden easter eggs.
  - **Zero per-message cost:** Uses standard WhatsApp Network traffic.
- **Limitations:**
  - **Ban Risk:** Higher risk if behavior patterns trigger anti-spam filters.
  - **Host Device:** Requires a linked phone number (Simulated or Real).
  - **Maintenance:** WhatsApp Web protocol changes can break connectivity temporarily.
- **Use Case:** Community groups, "Fun" bots, aggressive gamification features.

## Configuration

The mode is determined by `backend/config/whatsapp_mode.json`:

```json
{
  "mode": "experimental", // "official" or "experimental"
  "phone_number_id": "", // For Official Mode
  "access_token": "", // For Official Mode
  "webhook_token": "", // For Official Mode
  "session_path": "./whatsapp_sessions" // For Experimental Mode
}
```
