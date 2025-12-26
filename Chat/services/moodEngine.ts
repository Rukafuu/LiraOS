export type Mood = "calma" | "neutra" | "entusiasmada" | "reflexiva" | "exausta";

export type MoodState = {
  mood: Mood;
  fatigue: number;          // 0..100
  lastUpdateAt: number;     // ms
  lastMoodChangeAt: number; // ms
};

export type MoodEvent =
  | { type: "TICK" } // chamado periodicamente
  | { type: "USER_MESSAGE"; chars: number }
  | { type: "USER_AUDIO"; seconds: number }
  | { type: "ASSISTANT_RESPONSE"; tokens: number }
  | { type: "PROVIDER_ERROR"; status: number }
  | { type: "RETRY" }
  | { type: "REST" }; // New: User explicitly asking to rest

const clamp = (n: number, a = 0, b = 100) => Math.max(a, Math.min(b, n));

function nightMultiplier(now: Date) {
  const h = now.getHours();
  if (h >= 0 && h < 6) return 1.25;
  if (h >= 22 && h < 24) return 1.15;
  return 1.0;
}

export const initialMoodState: MoodState = {
  mood: "neutra",
  fatigue: 15, // Start with a little fatigue to feel human
  lastUpdateAt: Date.now(),
  lastMoodChangeAt: Date.now(),
};

export function updateMood(state: MoodState, event: MoodEvent, nowMs = Date.now()): MoodState {
  const now = new Date(nowMs);
  const dtMin = Math.max(0, (nowMs - state.lastUpdateAt) / 60000);
  const mult = nightMultiplier(now);

  // 1) Decaimento contínuo
  // -0.6 por minuto
  const decayPerMin = 0.6;
  let fatigue = state.fatigue - decayPerMin * dtMin;

  // 2) Incrementos por evento
  switch (event.type) {
    case "TICK":
      // nada além do decay
      break;

    case "USER_MESSAGE": {
      fatigue += 2 * mult;
      if (event.chars > 500) fatigue += 4 * mult;
      break;
    }

    case "USER_AUDIO": {
      // 0.4 por segundo (ajuste)
      fatigue += (event.seconds * 0.4) * mult;
      break;
    }

    case "ASSISTANT_RESPONSE": {
      fatigue += 1.5 * mult;
      if (event.tokens > 350) fatigue += 3 * mult;
      if (event.tokens > 900) fatigue += 6 * mult;
      break;
    }

    case "PROVIDER_ERROR": {
      if (event.status >= 500) fatigue += 12 * mult;
      else if (event.status === 429) fatigue += 10 * mult;
      else if (event.status >= 400) fatigue += 8 * mult;
      break;
    }

    case "RETRY":
      fatigue += 6 * mult;
      break;

    case "REST":
      fatigue -= 20; // Bonus recovery
      break;
  }

  fatigue = clamp(fatigue);

  // 3) Transição de mood (exausta) com histerese + cooldown
  const enter = 75;
  const exit = 55;
  const cooldownMs = 5 * 60 * 1000; // 5 min cooldown

  let mood = state.mood;
  const sinceChange = nowMs - state.lastMoodChangeAt;

  if (mood !== "exausta") {
    if (fatigue >= enter && sinceChange >= cooldownMs) {
      mood = "exausta";
      return { mood, fatigue, lastUpdateAt: nowMs, lastMoodChangeAt: nowMs };
    }
  } else {
    // If getting close to exit, maybe switch to "reflexiva" before "neutra"
    if (fatigue <= exit) {
      mood = "neutra"; 
      return { mood, fatigue, lastUpdateAt: nowMs, lastMoodChangeAt: nowMs };
    }
  }

  return { ...state, mood, fatigue, lastUpdateAt: nowMs };
}
