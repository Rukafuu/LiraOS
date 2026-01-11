export const FunCommands = {
    rollDice: () => {
        const val = Math.floor(Math.random() * 6) + 1;
        return `🎲 Você rolou um *${val}*!`;
    },

    playRPS: (userMove) => {
        const moves = ['pedra', 'papel', 'tesoura'];
        const botMove = moves[Math.floor(Math.random() * moves.length)];
        
        if (!moves.includes(userMove)) return "⚠️ Escolha: pedra, papel ou tesoura.";
        
        // Logic
        let result = "Empate!";
        if (
            (userMove === 'pedra' && botMove === 'tesoura') ||
            (userMove === 'papel' && botMove === 'pedra') ||
            (userMove === 'tesoura' && botMove === 'papel')
        ) {
            result = "Você venceu! 🎉";
        } else if (userMove !== botMove) {
            result = "Eu venci! 🤖";
        }
        
        return `🤖 Eu escolhi: ${botMove}\n${result}`;
    },

    ship: (u1, u2) => {
        const percent = Math.floor(Math.random() * 101);
        let msg = `💖 *Ship Calculator* 💖\n`;
        msg += `${u1} x ${u2}\n`;
        msg += `Compatibilidade: *${percent}%*\n\n`;
        
        if (percent > 90) msg += "🔥 ALERTA DE CASALZÃO!";
        else if (percent > 60) msg += "😏 Tem futuro...";
        else if (percent > 10) msg += "🥶 Melhor serem amigos.";
        else msg += "💀 Odeio dizer isso, mas corre.";
        
        return msg;
    }
};
