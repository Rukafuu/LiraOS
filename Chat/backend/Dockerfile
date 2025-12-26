# Dockerfile para LiraOS Backend (Híbrido Node + Python)
FROM node:20-slim

# Instalando Python e dependências de sistema necessárias para build de módulos nativos
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    ffmpeg \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Criando link simbólico para python
RUN ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

# 1. Instalar dependências do Node
COPY package*.json ./
RUN npm install --production

# 2. Configurar Python Virtual Environment (opcional mas recomendado) e dependências
# Copiando requirements se existirem (assumindo que estão na pasta python ou raiz)
# Se não tiver requirements.txt, instalamos os básicos usados no server
COPY python/requirements.txt ./python/
RUN pip3 install --no-cache-dir -r ./python/requirements.txt || echo "No requirements found or install failed, check logs"

# Falback para libs comuns se o requirements falhar ou não cobrir tudo
RUN pip3 install --no-cache-dir requests python-dotenv discord.py google-generativeai

# 3. Copiar o restante do código
COPY . .

# Variáveis de Ambiente Padrão (Devem ser sobrescritas no deploy)
ENV PORT=4000
ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "server.js"]
