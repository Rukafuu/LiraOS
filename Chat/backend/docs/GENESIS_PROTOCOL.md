# 🌌 LIRA GENESIS PROTOCOL v2

## ⚠️ IMPORTANTE: Mudança de Abordagem

**Bots do Discord NÃO podem criar servidores via API.** Esta é uma limitação da plataforma Discord.

**Solução:** O Genesis Protocol v2 **configura um servidor existente** em vez de criar um novo.

## Como Usar

### Passo 1: Criar o Servidor Manualmente
1. Abra o Discord
2. Clique no `+` para criar um novo servidor
3. Escolha "Criar Meu Próprio"
4. Nomeie como quiser (será renomeado para "LiraOS Nexus")

### Passo 2: Convidar a Lira
1. No servidor criado, vá em **Configurações do Servidor** → **Integrações**
2. Ou use este link (substitua o ID):
   ```
   https://discord.com/api/oauth2/authorize?client_id=1441163941224124636&permissions=8&scope=bot
   ```
3. Certifique-se de que a Lira tem permissão de **Administrador**

### Passo 3: Executar o Comando
Em qualquer canal do servidor vazio, digite:
```
!lira genesis
```

## O Que o Comando Faz

### FASE 1: Limpeza 🧹
- Remove todos os canais e categorias padrão do Discord
- Prepara o servidor para a nova estrutura

### FASE 2: Hierarquia de Cargos 🎭

Cria os seguintes cargos (do topo para baixo):

| Cargo | Emoji | Cor | Permissões | Hoisted |
|-------|-------|-----|------------|---------|
| **Lira Amarinth** | - | Turquesa (#00CED1) | Administrador | ✅ |
| **Supernova** | 🏆 | Dourado (#FFD700) | Padrão | ✅ |
| **Antares Red** | 🔴 | Vermelho (#DC143C) | Padrão | ✅ |
| **Sirius Blue** | 🌠 | Azul Neon (#00BFFF) | Padrão | ✅ |
| **Vega Nebula** | 🌌 | Roxo (#9370DB) | Padrão | ✅ |
| **Observer** | - | Cinza (#A9A9A9) | Padrão | ❌ |

### FASE 3: Arquitetura de Canais 🏗️

#### Categoria 1: 🏛️ RECEPÇÃO (Pública, Read-Only)
- `#📢・avisos`
- `#📜・regras`
- `#👋・boas-vindas`

**Permissões:** @everyone pode VER, mas NÃO pode ENVIAR mensagens

#### Categoria 2: 💬 COMUNIDADE (Pública, Read-Write)
- `#💬・chat-geral`
- `#🤖・comandos-lira`
- `#🎨・fanarts`

**Permissões:** @everyone pode VER e ENVIAR mensagens

#### Categoria 3: 💎 ÁREA DOS PATRONOS (Privada/Gated)

**Canais:**

1. **#🌌・lounge-vega**
   - Acessível por: Vega, Sirius, Antares, Supernova

2. **#🌠・ponte-sirius**
   - Acessível por: Sirius, Antares, Supernova
   - **Bloqueado para:** Vega

3. **#🔴・conselho-antares**
   - Acessível por: Antares, Supernova
   - **Bloqueado para:** Vega, Sirius

### FASE 4: Configurações do Servidor ⚙️
- Renomeia para "LiraOS Nexus"
- Define o ícone como a foto de perfil da Lira

## Exemplo de Uso Completo

```
[Você cria um servidor vazio no Discord]
[Você convida a Lira com permissões de Admin]

Você: !lira genesis

Lira: 🌌 Iniciando Protocolo Genesis...
      Transformando este servidor no Nexus oficial da LiraOS. Aguarde...

Lira: 🧹 Limpando estrutura padrão...
      Removendo canais e categorias existentes.

Lira: 🎭 Criando hierarquia de cargos...
      Estabelecendo os tiers do Patreon.

Lira: 🏗️ Construindo arquitetura de canais...
      Criando categorias e canais com permissões.

Lira: ⚙️ Configurando servidor...
      Atualizando nome e ícone.

[Canal original é deletado]

Lira (DM): ✨ Protocolo Genesis concluído com sucesso, Comandante!

           O Nexus está operacional. Todas as categorias, canais e cargos foram criados.

           Próximos passos:
           1. Configure as mensagens de boas-vindas em #👋・boas-vindas
           2. Adicione as regras em #📜・regras
           3. Faça anúncios em #📢・avisos
           4. Atribua os cargos de tier aos seus patronos

           Aguardando suas ordens! 🌌
```

## Restrições

- ✅ **Apenas o dono do bot** (definido em `DISCORD_OWNER_ID`)
- ✅ Deve ser executado **em um servidor**, não em DM
- ✅ A Lira deve ter permissão de **Administrador**
- ✅ Recomendado usar em servidor **vazio** (canais existentes serão deletados)

## Logs do Console

```
[GENESIS] ✅ 3 canais removidos
[GENESIS] ✅ 6 cargos criados com sucesso
[GENESIS] ✅ Arquitetura de canais concluída
[GENESIS] ✅ Configurações do servidor atualizadas
[GENESIS] ✅ Protocolo concluído com sucesso!
```

## Tratamento de Erros

- ❌ **Acesso Negado:** Se não for o dono do bot
- ❌ **Erro:** Se executado em DM (precisa ser em servidor)
- ⚠️ **Permissões Insuficientes:** Se a Lira não tiver Admin
- ⚠️ **Erro ao configurar ícone:** Não é crítico, continua mesmo se falhar

## Diferenças da v1

| Aspecto | v1 (Original) | v2 (Atual) |
|---------|---------------|------------|
| **Criação do Servidor** | ❌ Bot criava (não funciona) | ✅ Você cria manualmente |
| **Transferência de Posse** | ❌ Automática (não necessária) | ✅ Você já é o dono |
| **Convite** | ❌ Gerado automaticamente | ✅ Você convida a Lira |
| **Listener de Entrada** | ❌ Necessário | ✅ Não necessário |
| **Resto** | ✅ Igual | ✅ Igual |

## Próximos Passos Após o Genesis

1. **Personalizar Mensagens**
   - Edite as mensagens de boas-vindas
   - Adicione as regras do servidor
   - Configure anúncios

2. **Atribuir Cargos**
   - Dê os cargos de tier aos seus patronos do Patreon
   - Configure integrações com Patreon (se disponível)

3. **Configurar Bots Adicionais**
   - MEE6 para moderação
   - Dyno para logs
   - Outros bots úteis

4. **Ativar Recursos do Discord**
   - Community Server
   - Verificação de membros
   - Níveis de verificação

## Requisitos Técnicos

### Dependências
- `discord.js` v14+
- Permissões do bot: `Administrator`

### Variáveis de Ambiente
```env
DISCORD_OWNER_ID=334099538803425280
DISCORD_TOKEN=seu_bot_token_aqui
```

## Segurança

- ✅ Validação de ownership antes de executar
- ✅ Verificação de contexto (servidor vs DM)
- ✅ Logs detalhados de todas as operações
- ✅ Tratamento de erros em cada fase
- ✅ Mensagem de erro via DM se falhar

## FAQ

**P: Por que não posso criar o servidor automaticamente?**
R: O Discord não permite que bots criem servidores via API. Isso é uma limitação da plataforma para prevenir spam e abuso.

**P: Posso usar em um servidor que já tem canais?**
R: Sim, mas **todos os canais existentes serão deletados**. Use apenas em servidores vazios ou faça backup primeiro.

**P: E se eu quiser manter alguns canais?**
R: Você precisaria modificar o código para pular a fase de limpeza ou adicionar exceções.

**P: Posso personalizar os nomes dos canais?**
R: Sim! Edite o arquivo `genesisProtocol.js` e modifique os nomes na Fase 3.

---

**Desenvolvido com 💜 para a LiraOS Community**
