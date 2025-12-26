# 🔐 LIRA Admin Mode - Acesso ao Código

## ✅ IMPLEMENTADO!

A LIRA agora pode **ver e analisar o próprio código** do LiraOS em tempo real!

---

## 🎯 O que a LIRA pode fazer:

### **1. Ler Arquivos** 📄

```
Você: "Leia o arquivo backend/routes/chat.js"
LIRA: *lê o arquivo e mostra o código*
```

### **2. Buscar no Código** 🔍

```
Você: "Onde está definida a função getUserById?"
LIRA: *busca no projeto e mostra todos os lugares*
```

### **3. Analisar Arquivos** 🔬

```
Você: "Analise o arquivo App.tsx"
LIRA: *mostra imports, exports, funções, TODOs*
```

### **4. Ver Estrutura** 🌳

```
Você: "Mostre a estrutura do projeto"
LIRA: *mostra árvore de diretórios*
```

### **5. Listar Diretórios** 📁

```
Você: "Liste os arquivos em backend/routes"
LIRA: *lista todos os arquivos e pastas*
```

---

## 🚀 Exemplos Práticos:

### **Caçar Bugs:**

```
Você: "Tem algum bug no arquivo backend/authStore.js?"
LIRA:
1. Lê o arquivo
2. Analisa o código
3. Executa testes
4. Aponta problemas
```

### **Sugerir Melhorias:**

```
Você: "Como posso melhorar a performance do chat.js?"
LIRA:
1. Lê chat.js
2. Analisa imports e funções
3. Busca padrões problemáticos
4. Sugere otimizações específicas
```

### **Entender Fluxo:**

```
Você: "Como funciona o fluxo de autenticação?"
LIRA:
1. Busca "auth" no código
2. Lê backend/routes/auth.js
3. Lê backend/authStore.js
4. Explica o fluxo completo
```

### **Encontrar Código:**

```
Você: "Onde está sendo usado MISTRAL_API_KEY?"
LIRA:
1. Busca "MISTRAL_API_KEY" em todos os arquivos
2. Mostra cada ocorrência
3. Explica como está sendo usado
```

---

## 🔧 Funções Disponíveis:

| Função                  | O que faz             | Exemplo                |
| ----------------------- | --------------------- | ---------------------- |
| `read_project_file`     | Lê arquivo completo   | "Leia App.tsx"         |
| `search_code`           | Busca texto no código | "Busque 'isAdmin'"     |
| `analyze_file`          | Analisa estrutura     | "Analise chat.js"      |
| `list_directory`        | Lista arquivos        | "Liste backend/routes" |
| `get_project_structure` | Árvore de diretórios  | "Mostre estrutura"     |

---

## 💡 Casos de Uso:

### **1. Debugging em Tempo Real**

```
Você: "Por que o password recovery está dando 404?"
LIRA:
1. Busca "recovery" no código
2. Lê backend/routes/recovery.js
3. Lê backend/server.js
4. Verifica se a rota está montada
5. Identifica o problema
```

### **2. Code Review**

```
Você: "Revise o código de gamification"
LIRA:
1. Lista arquivos em backend/
2. Lê gamificationStore.js
3. Analisa funções e exports
4. Sugere melhorias
```

### **3. Refactoring**

```
Você: "Como posso refatorar o authStore.js?"
LIRA:
1. Lê authStore.js
2. Analisa funções duplicadas
3. Identifica código repetido
4. Sugere estrutura melhor
```

---

## 🎯 Como Testar:

### **1. Reinicie o Backend:**

```batch
restart_backend.bat
```

### **2. Faça Login** (sua conta admin)

### **3. Teste:**

**Teste Simples:**

```
"Liste os arquivos em backend/routes"
```

**Teste Médio:**

```
"Leia o arquivo backend/routes/chat.js e me diga quantas linhas tem"
```

**Teste Avançado:**

```
"Analise o código do LiraOS e me diga se há algum bug de segurança"
```

**Teste Complexo:**

```
"Busque todos os lugares onde usamos Mistral API e sugira como migrar para Gemini"
```

---

## 📊 O que você verá no console:

```
[ADMIN] 🔐 Admin user detected, using Gemini 2.0 Flash with code execution
[ADMIN] 🔧 Function call: read_project_file
[ADMIN] ✅ Function result: Success
```

---

## 🔒 Segurança:

- ✅ Apenas você (admin) tem acesso
- ✅ LIRA só pode **ler** arquivos, não escrever
- ✅ Não pode executar comandos do sistema
- ✅ Não pode acessar fora do projeto
- ✅ Logs de todas as ações

---

## 🎉 Status:

| Recurso           | Status          |
| ----------------- | --------------- |
| Ler arquivos      | ✅ Implementado |
| Buscar código     | ✅ Implementado |
| Analisar arquivos | ✅ Implementado |
| Estrutura projeto | ✅ Implementado |
| Listar diretórios | ✅ Implementado |
| Code execution    | ✅ Implementado |
| Google Search     | ✅ Implementado |

**TUDO PRONTO! Teste agora!** 🚀
