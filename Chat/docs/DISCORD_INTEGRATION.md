# 🎮 LiraOS - Discord Integration Guide

Lira is now fully integrated with Discord! This integration enables cross-platform chat, gamification syncing, voice interactions, and image analysis.

## ✨ Features

- **Cross-Platform Memory**: Lira remembers your conversations whether you talk on the Web or Discord.
- **Gamification Sync**: XP, Levels, and Coins earned on Discord count towards your main LiraOS profile.
- **Voice Support**: Lira can join voice channels and speak with you.
- **Vision & Image Gen**: Send images for analysis or ask Lira to generate art.
- **Tiered Access**: Exclusive "Themes" and access rights based on your subscription plan (Vega, Sirius, Antares).

## 🚀 Getting Started

1.  **Invite the Bot**: Check your server console on startup for the Invite Link.
2.  **Link Your Account**:
    - **User**: Type `.link your@email.com` in a DM or Server.
    - **Verify**: Check your email (or server console if SMTP fails) for a 6-digit code.
    - **Confirm**: Type `.confirm <code>` to finish linking.

## 🤖 Commands List

| Command                  | Description                                          |
| :----------------------- | :--------------------------------------------------- |
| **Account**              |                                                      |
| `.link <email>`          | Start the account linking process.                   |
| `.confirm <code>`        | Verify the code to complete linking.                 |
| `.perfil` / `.profile`   | View your Level, XP, Coins, Plan, and Current Theme. |
| **Voice**                |                                                      |
| `@Lira entrada` / `join` | Summon Lira to your voice channel.                   |
| `@Lira sai` / `leave`    | Dismiss Lira from the voice channel.                 |
| **Interactions**         |                                                      |
| `@Lira <msg>`            | Chat with Lira (or DM her directly).                 |
| `[Image Attachment]`     | Send an image for Lira to analyze/see.               |
| `"Generate an image..."` | Ask Lira to create ai art.                           |
| `.ajuda` / `.help`       | Show the list of available commands.                 |

## 🛠️ Troubleshooting

### Email Not Sending (SMTP Error)

If you see an error like `535 5.7.8 Username and Password not accepted`:

1.  **Debug Mode**: The bot will print the **Verification Code** directly to your **Server Terminal/Console**. Use that code to `.confirm`.
2.  **Fix**: Generate a new **App Password** for your Google Account and update `SMTP_PASS` in your `.env` file.

### "Access Restricted"

- **For Users**: You must have a paid plan (Vega/Sirius/Antares) to chat with Lira on Discord.
- **For Owner**: Ensure your `DISCORD_OWNER_ID` is set correctly in `.env` for unrestricted access to System Commands.

## 🎨 Gamification Themes

Your profile theme changes based on your plan:

- **Vega**: Vega Nebula 🌌
- **Sirius**: Sirius Blue 🌠
- **Antares**: Antares Red 🔴
- **Pro**: Pro Neon 🟢
- **Ultimate**: Ultimate Gold 🏆
- **Free**: Standard 🌑
