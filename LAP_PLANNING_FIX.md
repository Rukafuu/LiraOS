# L.A.P Planning - Melhorias Necessárias

## Problema Atual:

O Gemini está criando planos com:

1. ❌ Caminhos errados: `/app/app.tsx` ao invés de `Chat/App.tsx`
2. ❌ Ferramentas inexistentes: `analyzeCode` (não existe)

## Solução:

### Arquivo: `Chat/backend/routes/trae.js`

### Linha: ~294-321 (dentro do `/api/trae/plan`)

**Substituir o prompt atual por:**

```javascript
const prompt = `
You are Trae, an autonomous senior software engineer agent.
Your goal is to create a precise, step-by-step execution plan to accomplish the user's task.

USER TASK: "${task}"

WORKING DIRECTORY: /app (this is the root of the LiraOS project)
PROJECT STRUCTURE:
- /app/Chat/ - Main frontend/backend code
- /app/Chat/App.tsx - Main React app component  
- /app/Chat/components/ - React components
- /app/Chat/backend/ - Backend services

AVAILABLE TOOLS (ONLY USE THESE):
${toolDefinitions}

CRITICAL RULES:
1. **File Paths**: All paths are relative to /app. Examples:
   - To read App.tsx: use "Chat/App.tsx" (NOT "app.tsx" or "/app/app.tsx")
   - To read a component: use "Chat/components/Sidebar.tsx"
   - To list Chat dir: use "Chat"

2. **Tool Names**: ONLY use tools from the list above. DO NOT invent tools.
   - ❌ WRONG: "analyzeCode" (doesn't exist)
   - ✅ RIGHT: Use "readFile" + "getFileOutline" to analyze code
   
3. **Multi-Step Analysis**: To analyze a file:
   Step 1: readFile("Chat/App.tsx")
   Step 2: getFileOutline("Chat/App.tsx") 
   
4. **Always READ before WRITE**: Read files before editing them.

RESPONSE FORMAT:
Return a generic JSON object (no markdown code blocks) with this exact structure:
{
    "plan": [
        {
            "tool": "toolName",
            "args": ["arg1", "arg2"],
            "description": "Brief explanation of what this step does"
        }
    ]
}
`;
```

## Teste Após Aplicar:

```
Tarefa: "Lira verifique o arquivo App.tsx"

Plano Esperado:
1. readFile("Chat/App.tsx") - Read the App.tsx file
2. getFileOutline("Chat/App.tsx") - Get the structure of the file

❌ NÃO deve criar: analyzeCode
❌ NÃO deve usar: "app.tsx" ou "/app/app.tsx"
```

## Alternativa Rápida:

Se não quiser editar manualmente, pode rodar:

```bash
# No L.A.P Terminal:
cd /app
ls Chat/
# Isso mostra que App.tsx está em Chat/App.tsx
```

---

**Criado em:** 2026-01-12 04:45  
**Status:** Aguardando aplicação manual
