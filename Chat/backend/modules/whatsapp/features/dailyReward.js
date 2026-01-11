import { simpleStore } from '../data/simpleStore.js';

export async function handleDaily(userId, name) {
    const daily = await simpleStore.getDaily(userId);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Check cooldown
    if (now - daily.lastClaim < oneDay) {
        const nextClaim = new Date(daily.lastClaim + oneDay);
        const timeLeft = Math.ceil((nextClaim - now) / (1000 * 60 * 60));
        return `⏳ Calma, viajante! Você já pegou seu diário hoje.\nVolte em ~${timeLeft} horas.`;
    }

    // Streak Logic
    let streak = daily.streak;
    if (now - daily.lastClaim > oneDay * 2) {
        streak = 1; // Reset if missed a day
    } else {
        streak += 1; // Keep going
    }

    // Calculate Reward
    const baseXp = 50;
    const baseCoins = 10;
    
    // Bonus: 5 XP per streak day (cap at 50 bonus)
    const bonusXp = Math.min(streak * 5, 50);
    const bonusCoins = Math.floor(streak / 7) * 10; // 10 coins extra per week streak

    const totalXp = baseXp + bonusXp;
    const totalCoins = baseCoins + bonusCoins;

    await simpleStore.claimDaily(userId, { xp: totalXp, coins: totalCoins, streak });

    let msg = `🎁 *Recompensa Diária Coletada!*`;
    msg += `\n\n💰 +${totalCoins} Diamantes`;
    msg += `\n✨ +${totalXp} XP`;
    msg += `\n🔥 Streak: ${streak} dias`;
    
    if (streak % 7 === 0) msg += `\n💎 *Bônus Semanal Ativo!*`;
    
    return msg;
}
