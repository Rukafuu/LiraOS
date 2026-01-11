#!/bin/sh
set -e

echo "[STARTUP] 🚀 Iniciando LiraOS Backend..."

echo "[PRISMA] 🔄 Rodando migrations..."
npx prisma db push --accept-data-loss
echo "[PRISMA] ✅ Migrations concluídas!"

echo "[SERVER] 🔥 Iniciando servidor..."
node server.js
