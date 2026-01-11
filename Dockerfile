# Multi-stage build para reduzir tamanho final
FROM node:20-slim AS builder

# Instalar dependências do sistema
RUN apt-get update -y && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar apenas package files primeiro (cache layer)
COPY Chat/backend/package*.json ./backend/
COPY Chat/backend/prisma ./backend/prisma/

# Instalar dependências
WORKDIR /app/backend
RUN npm ci --only=production && \
    npx prisma generate && \
    npm cache clean --force

# Stage final - imagem mínima
FROM node:20-slim

# Instalar apenas runtime dependencies
RUN apt-get update -y && \
    apt-get install -y openssl ca-certificates procps && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Copiar node_modules do builder
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/prisma ./prisma

# Copiar apenas código necessário do backend
COPY Chat/backend/*.js ./
COPY Chat/backend/routes ./routes
COPY Chat/backend/services ./services
COPY Chat/backend/middlewares ./middlewares
COPY Chat/backend/modules ./modules

# Copiar diretórios opcionais (se existirem)
COPY Chat/backend/utils ./utils 2>/dev/null || true
COPY Chat/backend/config ./config 2>/dev/null || true
COPY Chat/backend/data ./data 2>/dev/null || true

# Copiar .env se existir
COPY Chat/backend/.env* ./ 2>/dev/null || true

# Expor porta
EXPOSE 4000

# Variável de ambiente
ENV NODE_ENV=production
ENV PORT=4000

# Comando de start
CMD ["node", "server.js"]
