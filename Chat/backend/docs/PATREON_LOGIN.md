# 🎨 LOGIN COM PATREON

## ✅ Implementado!

Agora os patronos podem fazer login na LiraOS diretamente com suas contas do Patreon!

## 🎯 Benefícios

### Para Patronos

- ✅ Login com um clique
- ✅ Tier detectado automaticamente
- ✅ Avatar importado do Patreon
- ✅ Acesso imediato aos recursos do tier

### Para Você

- ✅ Validação automática de patronos
- ✅ Sincronização de tiers
- ✅ Menos suporte manual
- ✅ Melhor experiência do usuário

## 🔧 Configuração no Patreon

### 1. Adicionar Redirect URI

No [Patreon Dashboard](https://www.patreon.com/portal/registration/register-clients):

1. Acesse seu aplicativo "LiraOS"
2. Vá em **Redirect URIs**
3. Adicione:
   ```
   http://localhost:4000/auth/patreon/callback
   ```
4. Para produção, adicione também:
   ```
   https://seudominio.com/auth/patreon/callback
   ```

### 2. Verificar Scopes

Certifique-se de que os seguintes scopes estão habilitados:

- ✅ `identity`
- ✅ `identity[email]`
- ✅ `identity.memberships`

## 🚀 Como Funciona

### Fluxo de Login

1. **Usuário clica em "Login com Patreon"**
2. **Redirecionado para Patreon** para autorizar
3. **Patreon retorna** com código de autorização
4. **Backend troca código** por access token
5. **Backend busca** informações do usuário
6. **Sistema detecta** se é patrono ativo e qual tier
7. **Conta é criada/atualizada** com tier correto
8. **Usuário é logado** automaticamente

### Detecção Automática de Tier

O sistema verifica o valor da contribuição e atribui o tier:

| Valor Mensal | Tier Atribuído |
| ------------ | -------------- |
| $5 - $19     | Vega           |
| $20 - $49    | Sirius         |
| $50 - $99    | Antares        |
| $100+        | Supernova      |

### Atualização de Dados

Ao fazer login com Patreon:

- ✅ **Nome** é atualizado
- ✅ **Avatar** é importado
- ✅ **Tier** é sincronizado
- ✅ **Email** é vinculado

## 💻 Implementação Frontend

### Adicionar Botão de Login

No componente de login, adicione:

```tsx
<button onClick={() => handlePatreonLogin()}>
  <PatreonIcon />
  Login com Patreon
</button>
```

### Função de Login

```typescript
const handlePatreonLogin = () => {
  const returnUrl = encodeURIComponent(window.location.origin);
  window.location.href = `http://localhost:4000/auth/patreon/init?return_to=${returnUrl}`;
};
```

### Processar Callback

Após o redirect do Patreon, o frontend recebe:

```typescript
// URL: /?oauth=patreon&token=...&refreshToken=...&email=...&name=...&uid=...

const params = new URLSearchParams(window.location.search);
if (params.get("oauth") === "patreon") {
  const token = params.get("token");
  const refreshToken = params.get("refreshToken");
  const email = params.get("email");
  const name = params.get("name");
  const uid = params.get("uid");

  // Salvar tokens e redirecionar
  localStorage.setItem("token", token);
  localStorage.setItem("refreshToken", refreshToken);

  // Redirecionar para dashboard
  window.location.href = "/";
}
```

## 🎨 Exemplo de UI

### Tela de Login

```
┌─────────────────────────────────┐
│                                 │
│         LiraOS Login            │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Login com Email          │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  🎨 Login com Patreon     │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  🐙 Login com GitHub      │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  🔵 Login com Google      │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### Após Login (Patrono Supernova)

```
┌─────────────────────────────────┐
│  👤 João Silva                  │
│  🏆 Supernova Patron            │
│  💰 $100/mês                    │
│                                 │
│  ✅ Acesso total aos recursos   │
│  ✅ Suporte prioritário         │
│  ✅ Comandos exclusivos         │
└─────────────────────────────────┘
```

## 🔍 Logs do Sistema

Quando um patrono faz login:

```
[OAuth Patreon] User: João Silva, Email: joao@example.com
[OAuth Patreon] Creating new user: joao@example.com
[OAuth Patreon] User created successfully: abc123
[OAuth Patreon] Active patron detected: supernova tier ($100)
[OAuth Patreon] Success! Redirecting user abc123
```

## 🎯 Casos de Uso

### Caso 1: Novo Patrono

1. Usuário se torna patrono no Patreon
2. Clica em "Login com Patreon" na LiraOS
3. Autoriza o acesso
4. Conta é criada automaticamente com tier correto
5. Acesso imediato aos recursos

### Caso 2: Patrono Existente

1. Usuário já tem conta na LiraOS
2. Faz login com Patreon
3. Sistema detecta email existente
4. Atualiza tier baseado na contribuição atual
5. Avatar é atualizado

### Caso 3: Upgrade de Tier

1. Patrono aumenta contribuição no Patreon
2. Faz login novamente na LiraOS
3. Sistema detecta novo valor
4. Tier é atualizado automaticamente
5. Novos recursos são liberados

### Caso 4: Cancelamento

1. Usuário cancela assinatura no Patreon
2. Faz login na LiraOS
3. Sistema detecta que não é mais patrono ativo
4. Tier é alterado para "free"
5. Acesso a recursos premium é removido

## 🔐 Segurança

- ✅ OAuth 2.0 padrão do Patreon
- ✅ State parameter para prevenir CSRF
- ✅ Tokens armazenados de forma segura
- ✅ Validação de email e tier
- ✅ Refresh tokens para sessões longas

## 🚧 Próximos Passos

### Sincronização Automática

Implementar webhook do Patreon para:

- Atualizar tier quando patrono muda plano
- Remover acesso quando cancela
- Notificar usuário sobre mudanças

### Benefícios por Tier

Implementar recursos exclusivos:

- **Vega**: Acesso ao Discord
- **Sirius**: Comandos premium da Lira
- **Antares**: Suporte prioritário
- **Supernova**: Recursos beta, sessões ilimitadas

### Dashboard de Patrono

Criar página especial mostrando:

- Status da assinatura
- Benefícios desbloqueados
- Histórico de contribuições
- Agradecimentos especiais

## 📞 Suporte

### Problemas Comuns

**Erro: "Missing code"**

- Usuário cancelou autorização no Patreon
- Solução: Tentar login novamente

**Erro: "Token exchange failed"**

- Credenciais do Patreon incorretas
- Solução: Verificar CLIENT_ID e CLIENT_SECRET

**Tier não atualizado**

- Cache de dados antigos
- Solução: Fazer logout e login novamente

## 🎉 Resultado Final

Agora você tem:

- ✅ Login com Patreon funcionando
- ✅ Detecção automática de tiers
- ✅ Sincronização de dados
- ✅ Experiência fluida para patronos

**Patronos podem fazer login com um clique e ter acesso imediato aos recursos do tier deles!** 🌌

---

**Desenvolvido com 💜 para a comunidade LiraOS!**
