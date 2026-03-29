#!/bin/sh
set -e

echo "[STARTUP] Iniciando LiraOS Backend..."

echo "[PRISMA] 🔄 Preparando banco de dados..."
node clean_db.js
npx prisma db push --accept-data-loss
echo "[PRISMA] ✅ Banco pronto!"

echo "[MIGRATE] Verificando tabelas..."
node scripts/migrate_sessions.js
echo "[MIGRATE] ✅ Migrações concluídas!"

echo "[SERVER] 🚀 Iniciando servidor..."
node server.js
