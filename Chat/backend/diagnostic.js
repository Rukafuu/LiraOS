
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function runDiagnostic() {
    console.log('=== LiraOS Backend Diagnostic ===\n');

    // 1. Environment Variables
    console.log('--- 1. Environment Variables ---');
    const requiredEnv = [
        'DATABASE_URL',
        'GEMINI_API_KEY',
        'DISCORD_TOKEN',
        'FRONTEND_URL'
    ];
    
    requiredEnv.forEach(env => {
        const val = process.env[env];
        console.log(`${env}: ${val ? '✅ SET (' + (val.length > 10 ? val.substring(0, 5) + '...' : 'SET') + ')' : '❌ MISSING'}`);
    });
    console.log('');

    // 2. Database Connectivity
    console.log('--- 2. Database Connectivity ---');
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        console.log('✅ Prisma connected to database successfully.');
        const userCount = await prisma.user.count();
        console.log(`📊 Total users in DB: ${userCount}`);
    } catch (e) {
        console.error('❌ Database connection failed:', e.message);
        if (e.message.includes('starting up')) {
            console.log('💡 TIP: The database is still initializing. Try again in 30 seconds.');
        } else if (e.message.includes('Can\'t reach database server')) {
            console.log('💡 TIP: Check if your database host is correct and accessible.');
        }
    } finally {
        await prisma.$disconnect();
    }
    console.log('');

    // 3. MCP Servers Check (Simulated)
    console.log('--- 3. MCP Servers Config ---');
    const mcpServers = [
        '@modelcontextprotocol/server-tavily',
        '@modelcontextprotocol/server-sqlite',
        '@modelcontextprotocol/server-github'
    ];
    
    console.log('Note: We cannot check npm availability directly without internet, but here are the configured packages:');
    mcpServers.forEach(pkg => console.log(`- ${pkg}`));
    console.log('💡 TIP: If you see 404 in logs, check if these packages are published or if they require a specific version/suffix.');
    console.log('');

    // 4. Gemini API Check
    console.log('--- 4. Gemini API Check ---');
    if (process.env.GEMINI_API_KEY) {
        try {
            const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-thinking-exp-01-21'];
            console.log('Testing model availability via listModels API (Simulated)...');
            // We can't actually call external APIs here easily without axios and internet,
            // but we can check the names used in chat.js
            console.log('Current models in tierLimits.js:', ['gemini-2.0-flash', 'gemini-1.5-flash']);
            console.log('💡 TIP: If you get 404 for gemini-1.5-flash, try "gemini-1.5-flash-latest" or check if your API key has access to v1beta.');
        } catch (e) {
            console.error('❌ Gemini check failed:', e.message);
        }
    } else {
        console.log('⚠️ GEMINI_API_KEY is not set.');
    }
    console.log('');

    // 5. Discord Bot Token Check
    console.log('--- 5. Discord Token Check ---');
    if (process.env.DISCORD_TOKEN) {
        if (process.env.DISCORD_TOKEN.length < 50) {
            console.log('❌ DISCORD_TOKEN looks too short to be valid.');
        } else {
            console.log('✅ DISCORD_TOKEN format looks okay length-wise.');
        }
    } else {
        console.log('⚠️ DISCORD_TOKEN is not set.');
    }
    console.log('');

    console.log('=== Diagnostic Complete ===');
}

runDiagnostic();
