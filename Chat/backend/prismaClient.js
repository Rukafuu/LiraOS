import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const basePrisma = new PrismaClient();

// Helper to handle JSON Strings in SQLite
const jsonFields = {
    User: ['preferences'],
    Session: ['messages'],
    Memory: ['tags'],
    Gamification: ['stats', 'unlockedThemes', 'unlockedPersonas', 'achievements'],
    Feedback: ['context']
};

const prisma = basePrisma.$extends({
    result: {
        user: {
            preferences: {
                needs: { preferencesStr: true },
                compute(user) { return parse(user.preferencesStr); }
            }
        },
        session: {
            messages: {
                needs: { messagesStr: true },
                compute(session) { return parse(session.messagesStr); }
            }
        },
        memory: {
            tags: {
                needs: { tagsStr: true },
                compute(mem) { return parse(mem.tagsStr); }
            }
        },
        gamification: {
            stats: { needs: { statsStr: true }, compute(g) { return parse(g.statsStr); } },
            unlockedThemes: { needs: { unlockedThemesStr: true }, compute(g) { return parse(g.unlockedThemesStr); } },
            unlockedPersonas: { needs: { unlockedPersonasStr: true }, compute(g) { return parse(g.unlockedPersonasStr); } },
            achievements: { needs: { achievementsStr: true }, compute(g) { return parse(g.achievementsStr); } }
        },
        feedback: {
            context: { needs: { contextStr: true }, compute(f) { return parse(f.contextStr); } }
        }
    },
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                const fields = jsonFields[model];
                if (fields && (operation === 'create' || operation === 'update' || operation === 'upsert')) {
                    if (args.data) {
                        processData(args.data, fields);
                    }
                    if (args.create) { // upsert
                        processData(args.create, fields);
                    }
                    if (args.update) { // upsert
                        processData(args.update, fields);
                    }
                }
                return query(args);
            }
        }
    }
});

function parse(str) {
    try { return str ? JSON.parse(str) : null; } catch { return {}; }
}

function processData(data, fields) {
    for (const field of fields) {
        if (data[field] !== undefined) {
            data[field + 'Str'] = JSON.stringify(data[field]);
            delete data[field];
        }
    }
}

export default prisma;
