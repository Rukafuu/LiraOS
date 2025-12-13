# 🚀 LiraOS - Setup Local

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** (vem com Node.js)
- **Python 3.8+** (para alguns scripts auxiliares)

## 📦 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/Rukafuu/LiraOS.git
cd LiraOS
```

### 2. Instale as dependências

#### Backend
```bash
cd liraos-backend
npm install
```

#### Frontend
```bash
cd ../liraos-frontend
npm install
```

#### Servidor Auxiliar (opcional)
```bash
cd ../liraos-misc/server
npm install
```

## ⚙️ Configuração

### 1. Configure as variáveis de ambiente

Copie os arquivos `.env.example` para `.env` em cada módulo:

#### Backend
```bash
cd liraos-backend
copy .env.example .env
```

#### Frontend
```bash
cd liraos-frontend
copy .env.example .env
```

### 2. Edite os arquivos `.env`

Abra cada arquivo `.env` e configure suas chaves de API:

**liraos-backend/.env:**
```env
MISTRAL_API_KEY=sua_chave_aqui
MISTRAL_BASE_URL=https://api.mistral.ai/v1
MISTRAL_MODEL=mistral-large-2512
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app
GMAIL_USER=seu_email@gmail.com
FROM_EMAIL=noreply@liraos.com
CLIENT_ORIGIN=http://localhost:5173
PORT=4000
```

**liraos-frontend/.env:**
```env
VITE_LIRA_BACKEND_URL=http://localhost:4000
VITE_LIRA_API_KEY=sua_chave_aqui
VITE_LIRA_VOICE_PROVIDER=grok
```

## 🚀 Execução

### Opção 1: Usar os scripts fornecidos

Na pasta raiz do projeto:
```bash
# Iniciar todos os serviços
Lira.bat

# Ou individualmente:
start_backend.bat
start_frontend.bat
```

### Opção 2: Comandos manuais

#### Terminal 1 - Backend
```bash
cd liraos-backend
npm run dev
```

#### Terminal 2 - Frontend  
```bash
cd liraos-frontend
npm run dev
```

#### Terminal 3 - Servidor Auxiliar (opcional)
```bash
cd liraos-misc/server
npm run dev
```

## 🌐 Acesso

Após iniciar os serviços:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000
- **API Documentation:** http://localhost:4000/api

## 🛠️ Scripts Disponíveis

### Backend
```bash
npm run dev      # Desenvolvimento
npm run build   # Build para produção
npm run start   # Executar em produção
```

### Frontend
```bash
npm run dev     # Desenvolvimento
npm run build  # Build para produção
npm run preview # Preview do build
```

## 🔧 Solução de Problemas

### Erro: "vite: command not found"
```bash
npm install -g vite
```

### Erro: Port já em uso
Edite as portas nos arquivos `.env`:
- Frontend: Altere `5173` para outra porta
- Backend: Altere `4000` para outra porta

### Erro: "Cannot find module"
Execute `npm install` em cada pasta:
```bash
cd liraos-backend && npm install
cd liraos-frontend && npm install
cd liraos-misc/server && npm install
```

## 📁 Estrutura do Projeto

```
LiraOS/
├── liraos-backend/     # API Node.js/TypeScript
├── liraos-frontend/    # Interface React/Vite
├── liraos-ai/         # Modelos de IA
├── liraos-misc/        # Utilitários
├── liraos-config/      # Configurações
├── liraos-docs/        # Documentação
├── liraos-scripts/     # Scripts de automação
└── Lira.bat           # Script principal
```

## 🎯 Próximos Passos

1. **Configure suas chaves de API** nos arquivos `.env`
2. **Execute o projeto** seguindo os passos acima
3. **Teste a interface** em http://localhost:5173
4. **Verifique a API** em http://localhost:4000/api
5. **Deploy no Vercel** quando estiver satisfeito

## 🆘 Suporte

Se tiver problemas:
1. Verifique se todas as dependências estão instaladas
2. Confirme que as variáveis de ambiente estão configuradas
3. Verifique se as portas não estão em uso
4. Consulte a documentação em `liraos-docs/`

**Divirta-se testando o LiraOS!** 🎉
