# 🧠 Sistema de Memória Inteligente - Guia Completo

## 📋 **Tipos de Memórias Salvas Automaticamente**

### **1. 📋 INFORMAÇÕES PESSOAIS** (`personal_info`)
**Detecta e salva automaticamente:**
- ✅ **Nomes**: "My name is João Silva"
- ✅ **Idade**: "I am 25 years old"  
- ✅ **Localização**: "I live in São Paulo", "I'm from Brazil"
- ✅ **Contatos**: Phone, email, address
- ✅ **Estado civil**: "married", "single", "family"

**Palavras-chave detectadas:**
- 'my name is', 'i am', "i'm", 'birthday', 'age', 'live in', 'from', 'city', 
- 'phone', 'email', 'address', 'family', 'married', 'single'

### **2. ❤️ PREFERÊNCIAS** (`preferences`)  
**Detecta e salva automaticamente:**
- ✅ **Gostos**: "I like pizza", "I love music"
- ✅ **Não gosta**: "I hate coffee", "I dislike traffic"  
- ✅ **Favoritos**: "My favorite movie is..."
- ✅ **Hobbies**: "My hobby is photography"
- ✅ **Interesses**: "I'm interested in programming"

**Palavras-chave detectadas:**
- 'i like', 'i love', 'i prefer', 'i hate', 'i dislike', 'favorite',
- 'hobby', 'interest', 'music', 'food', 'movie', 'book', 'color'

### **3. 💼 PROJETOS E TRABALHO** (`projects`)
**Detecta e salva automaticamente:**
- ✅ **Projetos**: "I'm working on a startup"
- ✅ **Trabalho**: "My job at Google", "career in tech"
- ✅ **Tarefas**: "Assignment due tomorrow"  
- ✅ **Milestones**: "Project milestone next week"
- ✅ **Negócios**: "My business idea"

**Palavras-chave detectadas:**
- 'project', 'work', 'job', 'career', 'startup', 'business', 'company',
- 'task', 'assignment', 'deadline', 'milestone'

### **4. 📅 DATAS IMPORTANTES** (`important_dates`)
**Detecta e salva automaticamente:**
- ✅ **Reuniões**: "Meeting with boss tomorrow"
- ✅ **Compromissos**: "Appointment at 3 PM"  
- ✅ **Aniversários**: "My birthday is December 25th"
- ✅ **Eventos**: "Conference next week"
- ✅ **Viagens**: "Vacation in July"

**Palavras-chave detectadas:**
- 'meeting', 'appointment', 'deadline', 'birthday', 'anniversary',
- 'event', 'conference', 'trip', 'vacation'

### **5. 👥 CONTATOS** (`contacts`)
**Detecta e salva automaticamente:**
- ✅ **Pessoas**: "My friend Carlos", "colleague Ana"  
- ✅ **Relacionamentos**: "I know John from college"
- ✅ **Apresentações**: "Met Sarah at conference"
- ✅ **Recomendações**: "My boss recommended..."

**Palavras-chave detectadas:**
- 'friend', 'colleague', 'boss', 'client', 'contact', 'know',
- 'met', 'introduction', 'recommendation'

## 🎯 **Como Funciona o Sistema**

### **Processo Automático:**
1. **Análise de Conteúdo** → Detecta palavras-chave automaticamente
2. **Extração de Fatos** → Extrai informações específicas usando regex
3. **Cálculo de Importância** → Score 0-100 pontos
4. **Categorização** → Organiza por tipo de memória
5. **Salvamento** → Só salva se score ≥ 30 pontos

### **Sistema de Pontuação:**
- **Base**: 10 pontos por categoria detectada
- **Bônus importante**: +20 pontos se contém "important", "remember", "don't forget", "crucial", "vital"
- **Info Pessoal**: +30 pontos (alta prioridade)
- **Preferências**: +25 pontos (alta prioridade)
- **Penalidade casual**: -10 se contém "just", "btw", "lol"

## 💡 **Exemplo Prático Completo**

**Usuário digita:** 
*"My name is Maria, I'm 28 years old, I live in Rio de Janeiro and I love programming. I'm working on a project for my company."*

**Sistema detecta automaticamente:**
- ✅ **PERSONAL_INFO**: name, age, location (+65 pontos)
- ✅ **PREFERENCES**: loves programming (+25 pontos)  
- ✅ **PROJECTS**: working on project (+25 pontos)
- ✅ **Total**: 115 pontos → **SALVA AUTOMATICAMENTE**

**Memória gerada:**
```
My name is Maria, I'm 28 years old, I live in Rio de Janeiro and I love programming. I'm working on a project for my company.

[Fatos extraídos: Nome: Maria; Idade: 28 anos; Localização: Rio de Janeiro; Gosta de: programming; Projeto: project for my company]
[Entidades: Maria; Rio de Janeiro]
[Importância: 85/100]
```

## 🚀 **Resultado**

Quando o usuário perguntar depois:
- *"What do you know about me?"*
- *"Do you remember my preferences?"*  
- *"Tell me about my projects"*

**O sistema busca automaticamente essas memórias relevantes e a IA responde com informações contextuais precisas sobre Maria!**

## ⚡ **Características Especiais**

### **Busca Inteligente:**
- **Relevância semântica**: Encontra memórias relacionadas por contexto
- **Scoring dinâmico**: Memórias mais recentes têm prioridade
- **Threshold mínimo**: Só retorna memórias com score > 20
- **Limite inteligente**: Máximo 5 memórias por conversa

### **Feedback Visual:**
- Notificação quando nova informação é memorizada: *"Nova informação memorizada! 🧠"*
- Categorização automática com tags
- Score de importância visível

### **Persistência:**
- **Local**: Salvo em `localStorage` do navegador
- **Backend**: Sincronizado com servidor
- **Cross-session**: Memórias persistem entre sessões

## 🎉 **Totalmente Automático!**

**O sistema funciona completamente automático - não precisa digitar comandos especiais!**

Basta conversar naturalmente e o sistema detecta e memoriza automaticamente:
- ✅ Suas informações pessoais
- ✅ Suas preferências  
- ✅ Seus projetos e trabalho
- ✅ Datas importantes
- ✅ Contatos e relacionamentos

**Sua LiraOS agora tem memória de nível ChatGPT!** 🚀
