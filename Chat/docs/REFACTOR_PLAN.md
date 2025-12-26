# LiraOS Refactoring Plan

## 1. Database Upgrade (Critical) - ✅ DONE

**Status:** Complete. Migrated to SQLite (`lira.db`). Removed JSON dependency.

## 2. Backend Modularization - 🚧 IN PROGRESS

**Status:** Route files created (`auth.js`, `gamification.js`, `memories.js`).
**Next Action:** Update `server.js` to mount these routes and remove legacy code.

- **Structure Implemented:**
  ```
  backend/
  ├── routes/
  │   ├── auth.js (✅ Created)
  │   ├── gamification.js (✅ Created)
  │   ├── memories.js (✅ Created)
  │   └── chat.js (Pending)
  ├── middlewares/
  │   └── authMiddleware.js (✅ Created)
  ```

## 3. Intelligent "Brain" (Vector Memory) - ⏳ PENDING

**Current Status:** Basic keyword matching (`similar` function in server.js).
**Problem:** AI misses context if exact words aren't used.
**Solution:** Local Vector Store.

- **Lib:** `@lancdb/lancedb` or just using `vectors` in SQLite extension.
- **Embeddings:** Use `Xenova/all-MiniLM-L6-v2` (runs locally in Node.js via ONNX) to convert text to vectors.
- **Benefit:** "Semantic Search". If user says "My vehicle", AI finds memory about "My car".

## 4. Frontend Optimization

- **State:** Verify `VoiceCallOverlay` isn't causing re-renders on the main `App.tsx`.
- **Bundling:** Ensure `lucide-react` and heavy libs are tree-shaken.

## 5. Security & Stability

- **Rate Limiting:** Add `express-rate-limit` to prevent API spam.
- **Logging:** Replace `console.log` with `winston` or `pino` for file-based logs (easier to debug crashes).

---

**Immediate Next Step Suggestion:**
Start with **Step 1 (SQLite Migration)**. It provides the biggest stability gain with the least code friction.
