# LIRA Admin Mode 🔐

## O que é?

Quando **você** (admin) usa o LiraOS Chat, a LIRA ganha **superpoderes**:

- ✅ **Execução de Código**: Pode executar Python e JavaScript
- ✅ **Google Search**: Busca informações atualizadas em tempo real
- ✅ **Análise Avançada**: Processa imagens, documentos e código
- ✅ **Gemini 2.0 Flash**: Modelo mais poderoso e atualizado

## Como Funciona?

### **Para Você (Admin):**

- User ID: `usr_1766449245238_96a75426fe68`
- Quando você faz login e usa o chat, automaticamente ativa o modo admin
- LIRA usa Gemini 2.0 Flash com code execution
- Pode executar código para te ajudar com debugging, cálculos, análises

### **Para Outros Usuários:**

- Usam Xiaomi/Mistral (modelo padrão)
- Sem code execution
- Sem Google Search
- Experiência normal

## Exemplos de Uso Admin:

### **1. Debugging com Código**

```
Você: "Analise este erro e me diga a causa raiz"
LIRA: *executa código Python para analisar stack trace*
```

### **2. Cálculos Complexos**

```
Você: "Calcule a performance do algoritmo X com dataset Y"
LIRA: *executa código para benchmark*
```

### **3. Busca Atualizada**

```
Você: "Qual a versão mais recente do Node.js LTS?"
LIRA: *busca no Google e retorna info atualizada*
```

### **4. Análise de Código**

```
Você: "Este código tem algum bug de segurança?"
LIRA: *analisa e executa testes*
```

## Configuração Atual:

- ✅ Gemini API Key configurada
- ✅ Admin User ID configurado
- ✅ Code Execution habilitado
- ✅ Google Search habilitado
- ✅ System prompt otimizado

## Segurança:

- ⚠️ **Apenas você** tem acesso ao modo admin
- ⚠️ Code execution roda em sandbox do Google
- ⚠️ Não tem acesso direto ao seu filesystem
- ⚠️ Não pode executar comandos do sistema

## Próximos Passos (Opcional):

Se quiser **ainda mais poder**, pode adicionar:

1. **MCP (Model Context Protocol)**

   - Acesso ao filesystem do projeto
   - Leitura/escrita de arquivos
   - Execução de comandos Git
   - Acesso ao banco SQLite

2. **Function Calling**
   - save_memory
   - create_task
   - analyze_document
   - etc.

## Como Testar:

1. Reinicie o backend: `restart_backend.bat`
2. Faça login com sua conta admin
3. Envie uma mensagem: "Execute código Python para calcular 2^100"
4. LIRA deve executar e retornar o resultado!

---

**Status:** ✅ Implementado e Pronto para Uso!
