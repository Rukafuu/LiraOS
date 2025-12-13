# 🤖 Lira - Sistema de Desenvolvimento com IA

**Lira** é uma plataforma revolucionária de desenvolvimento colaborativo que combina inteligência artificial, gamificação e uma arquitetura modular para transformar como você desenvolve software.

## 📁 Estrutura do Projeto

```
lira/
├── 📁 docs/                 # 📚 Documentação
│   ├── LIRA_SERVICES_README.md
│   └── LOGO_README.md
├── 📁 scripts/              # 🔧 Scripts de gerenciamento
│   ├── start_lira_services.sh     # Linux/Mac
│   ├── stop_lira_services.sh      # Linux/Mac
│   ├── start_lira_services.bat    # Windows
│   └── stop_lira_services.bat     # Windows
├── 📁 server/               # 🚀 Servidor central
│   └── lira_server.py
├── 📁 lira-developer-dashboard/  # 📊 Dashboard React
├── 📁 lira/                 # 🏗️ Módulos da Lira
│   ├── assistant_core.py
│   ├── discord/
│   ├── chat/
│   ├── stt/
│   ├── tts/
│   ├── llm/
│   ├── vision/
│   └── ...
└── 📁 logs/                 # 📝 Logs (gerado automaticamente)
```

## 🚀 Início Rápido

### 1. Instalar Dependências

```bash
# Python (servidor)
pip install fastapi uvicorn httpx

# Node.js (dashboard)
cd lira-developer-dashboard
npm install
```

### 2. Iniciar Todos os Serviços

#### Linux/Mac:
```bash
./scripts/start_lira_services.sh
```

#### Windows:
```batch
scripts\start_lira_services.bat
```

### 3. Acessar a Plataforma

**🌐 Gateway Principal:** `http://localhost:8000`

**📊 Serviços Individuais:**
- Dashboard: `http://localhost:3002`
- Chat UI: `http://localhost:5000`

## 🎯 Funcionalidades

### 🤖 IA Avançada
- **Refatoração inteligente** com Gemini API
- **Análise contextual** de código
- **Sugestões pedagógicas** no modo de aprendizado
- **Fallback automático** para simulação

### 🎮 Gamificação
- **Sistema de XP** por melhorias aplicadas
- **Níveis progressivos** com multiplicadores
- **Badges exclusivas** por conquistas
- **Histórico detalhado** de atividades

### 🏗️ Arquitetura Modular
- **13 módulos organizados** por prioridade
- **Interface visual** de status e seleção
- **Desenvolvimento orientado** por componentes
- **Escalabilidade** para novos módulos

## 📚 Documentação

- **[📖 Serviços da Lira](docs/LIRA_SERVICES_README.md)** - Como usar o sistema centralizado
- **[🎨 Logo da Lira](docs/LOGO_README.md)** - Como adicionar e configurar a logo
- **[📊 Dashboard](lira-developer-dashboard/README.md)** - Documentação específica do dashboard

## 🔧 Desenvolvimento

### Adicionar Novo Módulo

1. **Criar pasta** em `lira/novo_modulo/`
2. **Registrar** em `lira/learning/modules.json`
3. **Atualizar** interface no dashboard
4. **Testar** integração

### Scripts Disponíveis

```bash
# Linux/Mac
./scripts/start_lira_services.sh  # Iniciar tudo
./scripts/stop_lira_services.sh   # Parar tudo

# Windows
scripts\start_lira_services.bat   # Iniciar tudo
scripts\stop_lira_services.bat    # Parar tudo
```

## 📊 Monitoramento

### Logs Centralizados
```bash
# Ver logs em tempo real
tail -f logs/*.log

# Ver logs específicos
tail -f logs/lira_server.log
tail -f logs/dashboard.log
```

### Health Checks
- `http://localhost:8000/health` - Status geral
- `http://localhost:8000/api/services/status` - Status detalhado

## 🎨 Personalização

### Logo da Lira
- Arquivo: `lira-developer-dashboard/src/assets/lira_logo.png`
- Dimensões recomendadas: 120x150px
- Formato: PNG com transparência

### Tema Visual
- Cores baseadas em CSS custom properties
- Gradientes modernos
- Interface responsiva
- Tema dark otimizado

## 🚨 Troubleshooting

### Serviços Não Iniciam

```bash
# Verificar processos
ps aux | grep -E "(python|lira|node)"

# Verificar portas
netstat -tlnp | grep -E ":8000|:3002|:5000"

# Verificar logs
tail -f logs/*.log
```

### Resetar Estado

```javascript
// No console do navegador (Dashboard)
localStorage.removeItem('lira_developer_gamification');
location.reload();
```

## 🤝 Contribuição

1. **Fork** o projeto
2. **Crie** uma branch (`git checkout -b feature/nova-feature`)
3. **Commit** suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. **Push** para a branch (`git push origin feature/nova-feature`)
5. **Abra** um Pull Request

## 📄 Licença

Este projeto é licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- **Google Gemini AI** pela API de IA
- **React & TypeScript** pela base sólida
- **FastAPI** pelo servidor backend
- **Comunidade Open Source** pelas ferramentas incríveis

---

## 🎉 Conclusão

**Lira representa o futuro do desenvolvimento colaborativo**, combinando as melhores práticas de engenharia de software com gamificação inteligente e IA avançada.

**🚀 Junte-se à revolução do desenvolvimento com IA!**

**Desenvolvido com ❤️ para a comunidade de desenvolvedores**
