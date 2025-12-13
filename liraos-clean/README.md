# LiraOS

LiraOS é um sistema de inteligência artificial conversacional avançado com capacidades de síntese de voz, geração de imagens e interações multimodais.

## Estrutura do Projeto

```
LiraOS/
├── liraos-ai/              # Módulos de IA e modelos de voz
│   └── kokoro/             # Sistema de síntese de voz Kokoro
├── liraos-backend/         # API backend (Node.js/TypeScript)
├── liraos-frontend/        # Interface web (Vite/React/TypeScript)
├── liraos-misc/            # Utilitários e servidores auxiliares
├── liraos-config/          # Configurações globais
├── liraos-docs/            # Documentação técnica
├── liraos-scripts/         # Scripts de automação
└── liraos-backups/         # Backups e versões antigas
```

## Características Principais

- **IA Conversacional**: Sistema avançado de chat com memória persistente
- **Síntese de Voz**: Suporte a múltiplas vozes usando Kokoro
- **Geração de Imagens**: Integração com modelos de IA para criação visual
- **Interface Web**: Frontend moderno e responsivo
- **API RESTful**: Backend robusto com TypeScript
- **Configuração Modular**: Sistema flexível de configuração

## Configuração do Ambiente

### Pré-requisitos

- Node.js 18+ 
- Python 3.8+
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/Rukafuu/LiraOS.git
cd LiraOS
```

2. Configure as variáveis de ambiente:
   - Copie os arquivos `.env.example` para `.env` em cada módulo
   - Preencha as variáveis com suas credenciais

3. Instale as dependências:
```bash
# Backend
cd liraos-backend
npm install

# Frontend
cd ../liraos-frontend  
npm install

# Servidores auxiliares
cd ../liraos-misc/server
npm install
```

### Execução

Use os scripts fornecidos em `liraos-scripts/` para iniciar os serviços:

```bash
# Iniciar todos os serviços
Lira.bat

# Ou individualmente:
start_backend.bat
start_frontend.bat
```

## Documentação

- [Documentação Técnica](liraos-docs/README.md)
- [Configuração de Voz](liraos-ai/kokoro/README.md)
- [API Reference](liraos-backend/src/)

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## Suporte

Para suporte, abra uma issue no GitHub ou entre em contato através dos canais oficiais.

## Créditos

- Sistema de síntese de voz baseado em [Kokoro](https://github.com/ylacombe/kokoro)
- Interface desenvolvida com React + Vite
- Backend em Node.js/TypeScript
