import { generateReply } from '../chat/brainConnector.js';
import { simpleStore } from '../data/simpleStore.js';

// Active quizzes: { groupId: { answer: 'A', reward: 50, active: true } }
const activeQuizzes = {};

export const QuizGame = {
    async startQuiz(groupId, topic = 'conhecimentos gerais') {
        if (activeQuizzes[groupId]) {
            return "⚠️ Já tem um quiz rolando! Responda o anterior primeiro.";
        }

        // Generate Question using Gemini
        const prompt = `Gere uma pergunta de quiz aleatória de nível médio sobre "${topic}".
        Formato JSON estrito:
        {
            "question": "Texto da pergunta",
            "options": ["A) Opção 1", "B) Opção 2", "C) Opção 3", "D) Opção 4"],
            "correct": "A" (Apenas a letra),
            "explanation": "Breve explicação"
        }`;
        
        try {
            // We use generateReply but we need clean text. 
            // Ideally we'd have a direct JSON method, but let's parse the text.
            let raw = await generateReply(prompt + " Responda APENAS o JSON.");
            
            // Cleanup JSON markdown
            raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
            const quizData = JSON.parse(raw);

            activeQuizzes[groupId] = {
                answer: quizData.correct.toUpperCase().trim(),
                explanation: quizData.explanation,
                reward: 50
            };

            // Auto-cancel after 2 minutes
            setTimeout(() => {
                if (activeQuizzes[groupId]) {
                    delete activeQuizzes[groupId];
                    // Can't send message easily from here without 'sock', but that's fine.
                }
            }, 120000);

            return `🧠 *Quiz da Lira* 🧠\n\n*Pergunta:* ${quizData.question}\n\n${quizData.options.join('\n')}\n\n*Responda com a letra (A, B, C ou D)!*\nValendo 50 XP.`;

        } catch (e) {
            console.error("Quiz Error:", e);
            return "❌ Tive um branco... tente de novo!";
        }
    },

    checkAnswer(groupId, userId, text) {
        const quiz = activeQuizzes[groupId];
        if (!quiz) return null;

        const guess = text.trim().toUpperCase();
        const validGuesses = ['A', 'B', 'C', 'D'];
        
        // If it's a valid letter guess
        if (validGuesses.includes(guess)) {
            if (guess === quiz.answer) {
                delete activeQuizzes[groupId];
                // Award XP
                simpleStore.addXP(userId, quiz.reward);
                
                return `✅ *Resposta Correta!*\n\n${quiz.explanation}\n\n🎉 +${quiz.reward} XP para você!`;
            } else {
                // Wrong answer
                return `❌ *Errado!* Tente novamente (ou outra pessoa).`;
            }
        }
        return null; // Not a guess
    }
};
