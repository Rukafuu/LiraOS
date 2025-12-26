# 🎨 INTEGRAÇÃO PATREON

## Configuração

### 1. Credenciais no `.env`

As seguintes variáveis já foram adicionadas ao `.env`:

```env
# Patreon
PATREON_CLIENT_ID=NgaoABHw12LepojzIxu1TyqIHNTXsoWjF32GX1QaHyr6p24oOw_sxARCqojcBBJv
PATREON_CLIENT_SECRET=Atu0E2VuAlDoRqcL2ag2sqquQHxSfxFd3P2SC_2FgR9e3tsdmUm7T6VMgQS4U3Zd
PATREON_CREATOR_ACCESS_TOKEN=7meeA6f5Fb0UomFvQXSPgN0bnH4JN4AC66Y0RutqUS4
PATREON_CREATOR_REFRESH_TOKEN=va9WEmmtEyb0oRnw6cT6vdQ3pV-6FJUBHBlewe4AEr4
PATREON_CAMPAIGN_ID= # Será preenchido automaticamente
```

### 2. Instalar Dependência

```bash
npm install axios
```

## Funcionalidades

### ✅ Implementado

1. **Buscar Campanha**

   - Endpoint: `GET /api/patreon/campaign`
   - Retorna informações da sua campanha do Patreon

2. **Listar Patronos Ativos**

   - Endpoint: `GET /api/patreon/patrons`
   - Lista todos os patronos ativos com seus tiers

3. **Verificar Patrono por Email**

   - Endpoint: `POST /api/patreon/check-patron`
   - Verifica se um email é patrono ativo

4. **Renovar Tokens**

   - Endpoint: `POST /api/patreon/refresh-tokens`
   - Renova automaticamente os tokens de acesso

5. **Mapeamento de Tiers**
   - Endpoint: `GET /api/patreon/tiers`
   - Mostra o mapeamento entre valores e roles do Discord

### 🚧 Em Desenvolvimento

6. **Sincronização com Discord**
   - Endpoint: `POST /api/patreon/sync-discord`
   - Atribuir roles automaticamente baseado no tier do Patreon

## Mapeamento de Tiers

| Valor Mensal | Tier      | Role do Discord |
| ------------ | --------- | --------------- |
| $5 - $19     | Vega      | 🌌 Vega Nebula  |
| $20 - $49    | Sirius    | 🌠 Sirius Blue  |
| $50 - $99    | Antares   | 🔴 Antares Red  |
| $100+        | Supernova | 🏆 Supernova    |

## Uso da API

### 1. Buscar Informações da Campanha

```bash
curl http://localhost:4000/api/patreon/campaign
```

**Resposta:**

```json
{
  "success": true,
  "campaign": {
    "id": "12345",
    "name": "LiraOS",
    "patronCount": 42,
    "isMonthly": true
  }
}
```

### 2. Listar Patronos

```bash
curl http://localhost:4000/api/patreon/patrons
```

**Resposta:**

```json
{
  "success": true,
  "count": 42,
  "patrons": [
    {
      "id": "123",
      "name": "João Silva",
      "email": "joao@example.com",
      "status": "active_patron",
      "currentAmount": "50.00",
      "lifetimeSupport": "500.00",
      "tier": "antares",
      "discordRole": "🔴 Antares Red",
      "tiers": [
        {
          "id": "456",
          "title": "Antares Red Tier",
          "amountCents": 5000
        }
      ]
    }
  ]
}
```

### 3. Verificar Patrono

```bash
curl -X POST http://localhost:4000/api/patreon/check-patron \
  -H "Content-Type: application/json" \
  -d '{"email": "joao@example.com"}'
```

**Resposta (Patrono Ativo):**

```json
{
  "success": true,
  "isPatron": true,
  "tier": "antares",
  "discordRole": "🔴 Antares Red",
  "amountCents": 5000,
  "lifetimeSupportCents": 50000
}
```

**Resposta (Não Patrono):**

```json
{
  "success": true,
  "isPatron": false
}
```

### 4. Renovar Tokens

```bash
curl -X POST http://localhost:4000/api/patreon/refresh-tokens
```

**Resposta:**

```json
{
  "success": true,
  "message": "Tokens renovados com sucesso",
  "tokens": {
    "accessToken": "7meeA6f5Fb...",
    "refreshToken": "va9WEmmtEy..."
  },
  "warning": "Atualize o .env com os novos tokens (veja o console)"
}
```

**⚠️ IMPORTANTE:** Após renovar, atualize o `.env` com os novos tokens mostrados no console do servidor.

### 5. Ver Mapeamento de Tiers

```bash
curl http://localhost:4000/api/patreon/tiers
```

**Resposta:**

```json
{
  "success": true,
  "tiers": {
    "vega": {
      "name": "Vega Nebula",
      "minAmount": 5.0,
      "discordRole": "🌌 Vega Nebula"
    },
    "sirius": {
      "name": "Sirius Blue",
      "minAmount": 20.0,
      "discordRole": "🌠 Sirius Blue"
    },
    "antares": {
      "name": "Antares Red",
      "minAmount": 50.0,
      "discordRole": "🔴 Antares Red"
    },
    "supernova": {
      "name": "Supernova",
      "minAmount": 100.0,
      "discordRole": "🏆 Supernova"
    }
  }
}
```

## Integração com Discord

### Fluxo Atual

1. **Patrono se inscreve no Patreon**
2. **Patrono vincula conta** (`.link email@example.com` no Discord)
3. **Sistema verifica** se o email é patrono ativo
4. **Role é atribuída** automaticamente baseada no tier

### Próximos Passos

Para completar a integração, precisamos:

1. **Sistema de Vinculação**

   - Permitir que patronos vinculem email do Patreon com Discord ID
   - Armazenar no banco de dados

2. **Sincronização Automática**

   - Verificar periodicamente se patronos continuam ativos
   - Atualizar roles automaticamente
   - Remover roles de patronos inativos

3. **Webhook do Patreon**
   - Receber notificações em tempo real
   - Atualizar roles imediatamente

## Comandos do Discord

### Vincular Conta Patreon

```
.link email@patreon.com
```

**Fluxo:**

1. Usuário envia comando
2. Sistema verifica se o email é patrono ativo
3. Se sim, atribui role apropriada
4. Salva vinculação no banco de dados

### Verificar Status

```
.patron status
```

**Resposta:**

```
✅ Você é um patrono ativo!
🏆 Tier: Supernova
💰 Contribuição: $100/mês
💎 Suporte total: $1,200
```

### Sincronizar Manualmente

```
.patron sync
```

**Resposta:**

```
🔄 Sincronizando com Patreon...
✅ Role atualizada: 🏆 Supernova
```

## Renovação Automática de Tokens

O serviço renova automaticamente os tokens quando expiram:

1. **Detecta token expirado** (erro 401)
2. **Usa refresh token** para obter novos tokens
3. **Atualiza tokens** na memória
4. **Loga novos tokens** no console
5. **Retenta requisição** com novo token

**⚠️ Você deve atualizar o `.env` manualmente** com os novos tokens quando isso acontecer.

## Logs

Todos os eventos são logados:

```
[PATREON] Serviço inicializado
[PATREON] ✅ Campanha encontrada: LiraOS
[PATREON] 📊 Patronos: 42
[PATREON] 💰 Tipo: Mensal
[PATREON] ✅ 42 patronos ativos encontrados
[PATREON] 📋 João Silva (joao@example.com): 🔴 Antares Red
[PATREON] ✅ Tokens renovados com sucesso
```

## Segurança

- ✅ Tokens armazenados em `.env` (não commitados)
- ✅ Renovação automática de tokens
- ✅ Apenas endpoints autorizados podem acessar
- ✅ Validação de dados em todas as rotas

## Troubleshooting

### Erro: "Nenhuma campanha encontrada"

**Causa:** Token inválido ou expirado
**Solução:** Renove os tokens usando `/api/patreon/refresh-tokens`

### Erro: "401 Unauthorized"

**Causa:** Access token expirado
**Solução:** O sistema renova automaticamente, mas atualize o `.env`

### Patronos não aparecem

**Causa:** Podem estar inativos ou com pagamento pendente
**Solução:** Verifique o status no dashboard do Patreon

### Tier incorreto

**Causa:** Mapeamento de valores pode estar desatualizado
**Solução:** Ajuste os valores em `patreonService.js` → `getTierByAmount()`

## Próximas Implementações

1. **Webhook Handler**

   - Receber eventos do Patreon em tempo real
   - Atualizar roles automaticamente

2. **Dashboard Admin**

   - Interface para gerenciar patronos
   - Visualizar estatísticas
   - Sincronizar manualmente

3. **Notificações**

   - Avisar patronos quando roles são atualizadas
   - Agradecer novos patronos automaticamente

4. **Benefícios Automáticos**
   - Acesso a canais exclusivos
   - Comandos especiais da Lira
   - Recursos premium

---

**Desenvolvido com 💜 para a comunidade LiraOS!**
