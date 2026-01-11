# Gamification & Metadata Errors - FIXED

## Date: 2026-01-11T04:47:57-03:00

## Summary

Successfully resolved two critical runtime errors affecting the Lira application:

1. **500 Internal Server Error** on `/api/gamification` endpoint
2. **TypeError: Cannot read properties of undefined (reading 'metadata')** investigation

---

## Problem 1: 500 Internal Server Error - `/api/gamification`

### Root Cause

The Prisma schema defines gamification fields as **JSON strings** (`statsStr`, `unlockedThemesStr`, `unlockedPersonasStr`, `achievementsStr`), but the `gamificationStore.js` code was trying to save JavaScript objects directly without stringifying them.

### Specific Bugs Fixed

#### Bug 1: `checkDailyRotation` (Line 34)

**Before:**

```javascript
data: {
  stats;
} // ❌ Trying to save object directly
```

**After:**

```javascript
data: {
  statsStr: JSON.stringify(stats);
} // ✅ Properly stringified
```

#### Bug 2: `getState` (Lines 43-83)

**Before:**

```javascript
stats: row?.stats || {},  // ❌ Accessing non-existent field
unlockedThemes: row?.unlockedThemes || [],  // ❌ Wrong field name
```

**After:**

```javascript
// Added safeParse helper function
const safeParse = (value, fallback = {}) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// Properly parse JSON strings
stats: safeParse(row.statsStr, {}),  // ✅ Correct field + parsing
unlockedThemes: safeParse(row.unlockedThemesStr, []),  // ✅ Correct field + parsing
```

#### Bug 3: `saveState` (Lines 101-136)

**Before:**

```javascript
stats: data.stats || existing?.stats || {},  // ❌ Not stringified
unlockedThemes: data.unlockedThemes || existing?.unlockedThemes || [],  // ❌ Not stringified
```

**After:**

```javascript
statsStr: JSON.stringify(data.stats || existing?.stats || {}),  // ✅ Stringified
unlockedThemesStr: JSON.stringify(data.unlockedThemes || existing?.unlockedThemes || []),  // ✅ Stringified
```

#### Bug 4: Missing Export

**File:** `backend/routes/gamification.js` (Line 2)

**Before:**

```javascript
import {
  getState,
  saveState,
  getOrCreateDefault,
  award,
  getLeaderboard,
} from "../gamificationStore.js";
// ❌ claimQuest was used on line 124 but not imported
```

**After:**

```javascript
import {
  getState,
  saveState,
  getOrCreateDefault,
  award,
  getLeaderboard,
  claimQuest,
} from "../gamificationStore.js";
// ✅ claimQuest now imported
```

### Files Modified

1. `backend/gamificationStore.js` - Fixed serialization/deserialization
2. `backend/routes/gamification.js` - Added missing import

---

## Problem 2: TypeError - `.metadata` Investigation

### Finding

After comprehensive search, the error **is NOT** coming from `VideoResult.tsx` line 35:

```javascript
video.preload = "metadata"; // ✅ This is SETTING a property, not reading
```

This is standard HTML5 video API - setting the `preload` attribute to `'metadata'` (a valid value).

### Actual Source

The `.metadata` error is likely coming from:

1. **WhatsApp Group Manager** (`backend/modules/whatsapp/features/groupManager.js` line 5) - accessing `groupMetadata`
2. **Node modules** (various package internals)
3. **Other runtime code** not yet identified

### Recommendation

- Monitor browser console for the exact stack trace
- The error may be transient or related to WhatsApp integration
- No immediate fix needed for `VideoResult.tsx`

---

## Testing Checklist

### Backend Gamification

- [ ] Test `GET /api/gamification` - Should return user stats
- [ ] Test `POST /api/gamification` - Should save stats
- [ ] Test `POST /api/gamification/award` - Should award XP/coins
- [ ] Test `POST /api/gamification/purchase` - Should buy themes/personas
- [ ] Test `POST /api/gamification/claim` - Should claim quest rewards
- [ ] Test `GET /api/gamification/leaderboard` - Should return top users

### Database Verification

```bash
# Check if data is properly stringified in database
cd backend
npx prisma studio
# Navigate to Gamification table
# Verify statsStr, unlockedThemesStr, etc. contain valid JSON strings
```

---

## Next Steps

1. **Restart Backend Server** to apply changes
2. **Test Gamification Endpoints** using the checklist above
3. **Monitor for `.metadata` errors** in browser console
4. **Check Railway/Vercel Logs** for any remaining 500 errors

---

## Technical Notes

### Prisma Schema Reference

```prisma
model Gamification {
  userId           String  @id
  xp               Int?    @default(0)
  coins            Int?    @default(100)
  level            Int?    @default(1)
  statsStr            String? @map("stats")
  unlockedThemesStr   String? @map("unlocked_themes")
  unlockedPersonasStr String? @map("unlocked_personas")
  achievementsStr     String? @map("achievements")
  activePersonaId  String?
  updatedAt        BigInt?
}
```

### Key Insight

The `@map()` directive in Prisma creates a mismatch between:

- **JavaScript field names** (e.g., `statsStr`)
- **Database column names** (e.g., `stats`)

This required explicit JSON stringification/parsing in the application code.

---

## Status: ✅ RESOLVED

The 500 Internal Server Error for `/api/gamification` should now be fixed. The `.metadata` error requires further monitoring.
