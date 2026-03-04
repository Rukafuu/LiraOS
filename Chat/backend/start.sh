#!/bin/sh
set -e

echo "[STARTUP] Iniciando LiraOS Backend..."

echo "[PRISMA] 🔄 Limpando órfãos e preparando ambiente..."
node clean_db.js
npx prisma db push --accept-data-loss
echo "[PRISMA] Migrations concluídas!"

echo "[SERVER] Iniciando servidor..."
node server.js
