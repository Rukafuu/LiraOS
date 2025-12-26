# 🚀 Guia de Deploy Profissional: LiraOS

Este guia vai te levar do zero ao deploy completo usando **Vercel** (Frontend) e **VPS/Docker** (Backend).

## Parte 1: Frontend (Vercel)

Como você tem **Vercel Pro**, o site ficará super rápido.

1.  **Prepare o Código:**

    - Certifique-se de que todo o código está com commit no seu GitHub.
    - O diretório do frontend é: `Chat` (raiz do app React).

2.  **No Painel da Vercel:**

    - Clique em **"Add New..."** -> **"Project"**.
    - Importe o repositório do GitHub.
    - **Root Directory:** Edite e selecione a pasta `Chat` (ou `.` se você moveu tudo). _Nota: O backend está dentro de Chat/backend, mas o Vercel só precisa do frontend._
    - **Environment Variables:** Adicione:
      - `VITE_API_BASE_URL`: A URL do seu VPS (ex: `https://api.liraos.com` ou `http://IP-DO-VPS:4000`). _Se você ainda não tem o IP, coloque um temporário e mude depois._

3.  **Deploy:** Clique em Deploy. A Vercel vai instalar, rodar o build e publicar.

---

## Parte 2: Backend (VPS + Docker)

Para o "cérebro" (Node.js + Python), usaremos um VPS (DigitalOcean, Hetzner, AWS) com Docker.

### 2.1. Preparar o Servidor

1.  Alugue um servidor (Ubuntu 22.04 ou superior). 2GB RAM mínimo recomendado.
2.  Acesse via SSH e instale o Docker:
    ```bash
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    ```

### 2.2. Subir o Código

Existem várias formas (git clone, enviar arquivos). A mais profissional é criar uma **Imagem Docker**, mas a mais simples para começar é:

1.  Clone seu repo no servidor.
2.  Entre na pasta `Chat/backend`.
3.  Renomeie o `.env.production.example` para `.env` e preencha suas chaves.

### 2.3. Rodar com Docker

Como já criei o `Dockerfile`, basta rodar:

```bash
# 1. Construir a imagem (pode demorar uns minutos na primeira vez)
docker build -t lira-backend .

# 2. Rodar o container
# -d: roda em background
# -p 4000:4000: libera a porta 4000
# --restart always: se cair, volta sozinho
docker run -d \
  --name lira-server \
  -p 4000:4000 \
  --restart always \
  --env-file .env \
  lira-backend
```

### 2.4. Domínio (Opcional mas recomendado)

O Vercel exige HTTPS para evitar erros de "Mixed Content". Se seu VPS for apenas HTTP (IP direto), o navegador pode bloquear.

- **Solução:** Use um domínio para o backend (ex: `api.seudominio.com`) e configure SSL (Nginx + Certbot) OU use Cloudflare para mascarar o IP.

---

## checklist Final

- [ ] Vercel Environment Var `VITE_API_BASE_URL` aponta para o Backend.
- [ ] Backend `.env` `FRONTEND_URL` aponta para o Vercel.
- [ ] Backend `.env` `ENABLE_GAME_BRIDGE` está `false`.
