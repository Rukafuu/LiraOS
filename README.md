<div align="center">

# LIRA OS

### AI COMPANION ECOSYSTEM

**Gaming Copilot Edition — Version 2.0**

<br>

# PROJETO PAUSADO POR TEMPO INDEFINIDO

### O desenvolvimento, a manutenção e o deploy público do Lira OS estão suspensos.

O código permanece disponível como registro histórico, referência técnica e base para uma possível retomada futura.

Não existe atualmente uma previsão para o retorno do projeto.

<br>

---

`STATUS: INDEFINITE HIATUS`

`MAINTENANCE: SUSPENDED`

`PUBLIC DEPLOY: NOT MAINTAINED`

---

</div>

## Sobre o projeto

O **Lira OS** é um ecossistema experimental de AI companion criado para explorar interações entre inteligência artificial, jogos, automação de desktop, visão computacional, síntese de voz e avatares virtuais.

O projeto foi dividido em três componentes principais:

* **Lira Companion**, uma aplicação desktop voltada para jogos e automações.
* **Lira Chat**, uma interface conversacional web e desktop.
* **Lira Backend**, responsável pelos serviços de IA, integrações e persistência.

Durante seu desenvolvimento, o Lira OS serviu como laboratório para testar arquiteturas de agentes, memória conversacional, percepção visual, TTS, integrações externas e experiências de companion baseadas em contexto.

---

## Componentes

### Lira Companion

Aplicação desktop construída com Electron.

Principais recursos:

* Detecção automática de jogos.
* Perfis para League of Legends, Valorant, osu!, Minecraft e Counter-Strike 2.
* Modo Corinthians para acompanhamento e comentários sobre futebol.
* Análise visual utilizando Gemini.
* Síntese de voz com ElevenLabs e Minimax.
* Avatar Live2D.
* Automações de desktop.
* Ferramentas experimentais de limpeza e organização por RPA.

### Lira Chat

Interface conversacional web e desktop.

Principais recursos:

* Chat com respostas contextuais.
* Persistência de conversas e memória com Firestore.
* Sistema de níveis, experiência e conquistas.
* Modo Trae para planejamento assistido por IA.
* Internacionalização.
* Interação por voz.
* Build desktop utilizando Tauri.

### Lira Backend

API construída com Node.js.

Principais responsabilidades:

* API REST.
* Comunicação em tempo real com WebSocket.
* Gerenciamento de perfis de jogos.
* Integração com Gemini Vision.
* Pipeline de TTS com múltiplos fallbacks.
* Persistência de dados.
* Integração com Discord.
* Integração com WhatsApp.
* Serviços compartilhados entre o Chat e o Companion.

---

## Estado atual

| Área                  | Estado                                 |
| --------------------- | -------------------------------------- |
| Desenvolvimento       | Pausado por tempo indefinido           |
| Manutenção            | Suspensa                               |
| Novas funcionalidades | Não planejadas                         |
| Correções de bugs     | Não garantidas                         |
| Pull Requests         | Podem não ser revisados                |
| Deploy público        | Não mantido                            |
| Dados de produção     | Não devem ser considerados permanentes |
| Retomada              | Sem previsão                           |

O repositório pode conter dependências desatualizadas, funcionalidades incompletas, integrações desativadas e configurações que não representam mais os serviços originalmente utilizados em produção.

---

## Estrutura do repositório

```text
Lira/
├── Chat/
│   ├── backend/              # API e serviços Node.js
│   ├── src/                  # Frontend React
│   └── src-tauri/            # Build desktop com Tauri
│
├── LiraCompanion/
│   ├── gameDetection.js      # Detecção automática de jogos
│   ├── index.html            # Interface e integração Live2D
│   └── main.js               # Processo principal do Electron
│
├── LiraGamer/                # Implementação antiga e descontinuada
│
└── docs/                     # Documentação técnica e arquitetural
```

---

## Tecnologias

### Frontend

* React
* Vite
* Tauri
* Electron
* Live2D

### Backend

* Node.js
* Express
* WebSocket
* Firebase
* Firestore

### Inteligência artificial

* Gemini Vision
* ElevenLabs
* Minimax
* Sistemas experimentais de memória conversacional
* Planejamento assistido por agentes

### Integrações

* Discord
* WhatsApp
* Railway
* GitHub Actions

---

## Funcionalidades implementadas

* [x] Gaming Copilot.
* [x] Detecção automática de jogos.
* [x] Perfis contextuais por jogo.
* [x] Modo Corinthians.
* [x] TTS com ElevenLabs e Minimax.
* [x] Pipeline de fallback para síntese de voz.
* [x] Análise visual com Gemini.
* [x] Avatar Live2D.
* [x] Automações de desktop.
* [x] Memória conversacional com Firestore.
* [x] Sistema de níveis e experiência.
* [x] Conquistas.
* [x] Internacionalização.
* [x] Integração com Discord.
* [x] Integração com WhatsApp.
* [x] Comunicação em tempo real com WebSocket.

---

## Roadmap congelado

As funcionalidades abaixo foram planejadas, mas não serão desenvolvidas enquanto o projeto permanecer pausado.

* [ ] Detecção de eventos por OCR.
* [ ] Identificação de kills, mortes e eventos durante partidas.
* [ ] Integração com OBS.
* [ ] Criação automática de clipes.
* [ ] Hotkeys globais.
* [ ] Comandos de voz.
* [ ] Suporte aprimorado para múltiplos monitores.
* [ ] Aplicativo mobile.
* [ ] Expansão do sistema de memória.
* [ ] Maior autonomia do companion durante jogos.

---

## Execução local

> Atenção: as instruções abaixo representam o ambiente utilizado durante o desenvolvimento. Algumas dependências, APIs ou integrações podem não funcionar sem ajustes.

### Clonando o repositório

```bash
git clone https://github.com/Rukafuu/LiraOS
cd Lira
```

### Backend

```bash
cd Chat/backend
npm install
cp .env.example .env
npm run dev
```

Configure as variáveis de ambiente antes de iniciar o servidor.

### Frontend web

Em outro terminal:

```bash
cd Chat
npm install
npm run dev
```

### Lira Companion

Em outro terminal:

```bash
cd LiraCompanion
npm install
npm start
```

---

## Build

### Companion para Windows

```bash
cd LiraCompanion
npm run build:win
```

Saída esperada:

```text
dist/Lira Companion Setup 1.0.0.exe
```

### Aplicação desktop com Tauri

```bash
cd Chat
npm run tauri build
```

Saída esperada:

```text
src-tauri/target/release/
```

### Aplicação web

```bash
cd Chat
npm run build
```

Saída esperada:

```text
dist/
```

---

## Variáveis de ambiente

Exemplo das principais variáveis utilizadas pelo projeto:

```env
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
MINIMAX_API_KEY=
FIREBASE_SERVICE_ACCOUNT_JSON=
```

Nunca publique chaves reais, tokens, credenciais ou arquivos de service account no repositório.

Algumas integrações podem exigir variáveis adicionais descritas nos READMEs internos de cada componente.

---

## Deploy legado

O projeto utilizava Railway para hospedar o backend e a aplicação web.

```bash
git push origin main
```

O push para a branch principal acionava o processo de deploy automático configurado no Railway.

Durante a pausa:

* O ambiente de produção não é mantido.
* O endereço público pode ficar indisponível.
* Serviços externos podem ter sido removidos ou desativados.
* Não existe garantia de preservação dos dados armazenados no ambiente.
* O deploy não deve ser utilizado como ambiente confiável de produção.

Deploy legado:

```text
https://liraos-production.up.railway.app
```

---

## Documentação

### Interfaces

* [Lira Companion](./LiraCompanion/README.md)
* [Lira Chat](./Chat/README.md)
* [Troubleshooting](./Chat/docs/TROUBLESHOOTING.md)

### Desenvolvimento

* [Backend API](./Chat/backend/README.md)
* [Detecção automática](./LiraCompanion/AUTO_DETECTION.md)
* [Configuração de TTS](./Chat/backend/TTS_SETUP_GUIDE.md)
* [Ideias de arquitetura](./docs/ARCHITECTURE_IDEAS.md)

### Infraestrutura

* [Guia de deploy](./DEPLOY_GUIDE.md)
* [Checklist do Railway](./RAILWAY_VERIFICATION.md)

Parte da documentação pode estar desatualizada em relação ao estado final do código.

---

## Custos históricos

Estimativa dos custos mensais durante a operação do projeto:

| Serviço        |             Custo estimado |
| -------------- | -------------------------: |
| Railway        |                      US$ 5 |
| Gemini Vision  | Gratuito dentro das quotas |
| ElevenLabs     |             US$ 5 a US$ 22 |
| Firestore      | Gratuito dentro das quotas |
| Total estimado |            US$ 10 a US$ 30 |

Esses valores são apenas registros históricos e podem não representar os preços atuais dos serviços.

---

## Contribuições

O repositório continua disponível para estudo, forks e experimentação.

Fluxo convencional de contribuição:

```bash
git checkout -b feature/nova-feature
git add .
git commit -m "Add: nova feature"
git push origin feature/nova-feature
```

Depois disso, abra um Pull Request no GitHub.

Como o projeto está pausado por tempo indefinido:

* Pull Requests podem não ser analisados.
* Issues podem permanecer sem resposta.
* Não existe compromisso com releases futuras.
* Forks independentes são bem-vindos.
* O repositório original pode não acompanhar atualizações feitas pela comunidade.

---

## Histórico de versões

### Version 2.0 — Gaming Copilot Edition

Lançada em 18 de janeiro de 2026.

* Detecção automática de jogos.
* Modo Corinthians.
* TTS com múltiplos provedores.
* Análise visual baseada em contexto.
* Deploy utilizando Railway.
* Expansão das integrações externas.

### Version 1.5 — Desktop Companion

Lançada em dezembro de 2025.

* Aplicação Electron.
* Avatar Live2D.
* Automações de desktop.
* Ferramentas experimentais de RPA.

### Version 1.0 — Core

Lançada em novembro de 2025.

* Chat conversacional.
* Integração inicial com Gemini.
* Persistência utilizando Firestore.
* Primeira arquitetura do companion.

---

## Por que o projeto foi pausado?

O Lira OS cresceu como um projeto experimental, acumulando diferentes interfaces, provedores de IA, integrações, arquiteturas e ideias de produto.

Manter toda essa infraestrutura exige tempo, custos operacionais e dedicação contínua. Por esse motivo, o desenvolvimento foi interrompido sem uma data definida para retorno.

A pausa não apaga o que foi construído.

O repositório permanece como registro de uma fase importante de experimentação com companions de inteligência artificial, agentes, visão computacional, voz, jogos e interação humano-máquina.

Talvez a Lira volte algum dia em uma arquitetura diferente.

Por enquanto, ela descansa.

---

## Licença

Este projeto é distribuído sob a licença MIT.

O código pode ser utilizado, modificado e distribuído para fins pessoais, educacionais e comerciais, respeitando os termos presentes no arquivo de licença.

APIs, modelos, personagens, marcas, assets e serviços de terceiros permanecem sujeitos às suas próprias licenças e termos de uso.

---

## Autor

Desenvolvido por **Rukafuu**.

Tecnologias, arquitetura, experimentos de IA, integrações e conceito original do Lira OS.

---

<div align="center">

# PROJETO PAUSADO POR TEMPO INDEFINIDO

**Sem manutenção ativa. Sem previsão de retorno.**

`LIRA OS — 2025 / 2026`

</div>
