# ==========================================
# Stage 1: Build Frontend (React + Vite)
# ==========================================
FROM node:20-slim AS frontend-builder
WORKDIR /app

# Copiar dependências do frontend
COPY Chat/package*.json ./

# Instalar dependências (usando install para garantir compatibilidade)
RUN npm install

# Copiar código fonte do frontend
COPY Chat/ .

# Buildar o frontend (gera pasta 'dist')
# Isso é CRUCIAL para que as correções do frontend apareçam em produção
RUN npm run build

# ==========================================
# Stage 2: Build Backend (Node.js + Prisma)
# ==========================================
FROM node:20-slim AS backend-builder
WORKDIR /app

# Instalar deps de sistema necessárias para Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates

# Copiar dependências do backend
COPY Chat/backend/package*.json ./
COPY Chat/backend/prisma ./prisma/

# Instalar deps do backend
RUN npm install --omit=dev && npx prisma generate

# ==========================================
# Stage 3: Runner (Final Image)
# ==========================================
FROM node:20-slim AS runner

# Deps de runtime
RUN apt-get update -y && \
    apt-get install -y openssl ca-certificates procps && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Copiar módulos do backend
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/prisma ./prisma

# Copiar código fonte do backend
COPY Chat/backend .
RUN chmod +x start.sh

# Copiar o build do frontend para onde o server.js espera (/app/dist)
# O workdir é /app/backend, então ../dist resolve para /app/dist
COPY --from=frontend-builder /app/dist ../dist

# Configuração de Ambiente
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Iniciar com script de migração robusto
CMD ["./start.sh"]
