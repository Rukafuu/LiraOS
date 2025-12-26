# LiraOS - Scripts de Inicialização

## 🚀 Scripts Principais

### `start_all.bat` ⭐ RECOMENDADO

**O que faz:**

- ✅ Mata TODOS os processos antigos (backend, frontend, OCR, TTS)
- ✅ Inicia backend na porta 4000
- ✅ Aguarda backend ficar online
- ✅ Inicia frontend na porta 5173
- ✅ Abre navegador automaticamente
- ✅ Mostra status de saúde

**Quando usar:** Sempre que quiser reiniciar tudo do zero.

**Como usar:**

```batch
start_all.bat
```

---

## 🔧 Scripts Individuais

### `restart_backend.bat`

**O que faz:**

- Mata processos nas portas 4000 e 4005
- Inicia novo backend

**Quando usar:** Quando você só quer reiniciar o backend.

**Como usar:**

```batch
restart_backend.bat
```

---

### `restart_frontend.bat`

**O que faz:**

- Mata processos na porta 5173
- Inicia novo frontend

**Quando usar:** Quando você só quer reiniciar o frontend.

**Como usar:**

```batch
restart_frontend.bat
```

---

## 🛠️ Scripts de Utilidade

### `backup_database.bat`

**O que faz:**

- Cria backup do banco de dados SQLite
- Salva em `backups/lira_[timestamp].db`

**Quando usar:** Antes de fazer mudanças importantes.

**Como usar:**

```batch
backup_database.bat
```

---

## 📊 Scripts de Diagnóstico

### `diagnose_backend.bat`

**O que faz:**

- Verifica se backend está rodando
- Mostra processos usando porta 4000
- Oferece opção de matar e reiniciar
- Testa endpoint de saúde

**Quando usar:** Quando o backend não está funcionando.

---

### `test_minimal_server.bat`

**O que faz:**

- Inicia servidor mínimo de teste
- Testa rota de recovery isoladamente

**Quando usar:** Para debug de problemas de rota.

---

## 🗑️ Scripts Obsoletos (Podem ser deletados)

Os seguintes scripts foram substituídos pelo `start_all.bat`:

- `run_frontend_service.bat` → Use `restart_frontend.bat`
- `start_frontend.bat` → Use `restart_frontend.bat`
- `test_frontend.bat` → Apenas para debug

---

## 📝 Fluxo Recomendado

### Desenvolvimento Normal:

1. Execute `start_all.bat`
2. Trabalhe normalmente
3. Se precisar reiniciar algo, use `restart_backend.bat` ou `restart_frontend.bat`

### Após Mudanças no Código:

1. Execute `start_all.bat` (mata tudo e reinicia)

### Antes de Mudanças Importantes:

1. Execute `backup_database.bat`
2. Continue trabalhando

---

## 🎯 Resumo Rápido

| Script                 | Mata Processos | Inicia Backend | Inicia Frontend | Abre Browser |
| ---------------------- | -------------- | -------------- | --------------- | ------------ |
| `start_all.bat`        | ✅ Todos       | ✅             | ✅              | ✅           |
| `restart_backend.bat`  | ✅ Backend     | ✅             | ❌              | ❌           |
| `restart_frontend.bat` | ✅ Frontend    | ❌             | ✅              | ❌           |

---

## 🔍 Portas Usadas

- **4000**: Backend principal
- **5173**: Frontend (Vite)
- **5001**: OCR Server (opcional)
- **5002**: XTTS Voice (opcional)

---

## ⚠️ Troubleshooting

**Problema:** "Port already in use"
**Solução:** Execute `start_all.bat` que mata todos os processos

**Problema:** Backend não inicia
**Solução:** Execute `diagnose_backend.bat` para debug

**Problema:** Frontend não abre
**Solução:** Verifique se `node_modules` existe, rode `npm install`

---

**Última atualização:** 2025-12-22
