import { ProjectFile } from './types';

export const INITIAL_FILES: ProjectFile[] = [
  {
    path: 'frontend/app.js',
    description: 'Controle geral do chat, voz, input, fetch e rotina de mensagens.',
    type: 'frontend',
    content: `// Frontend Logic for Lira
import { VoiceHandler } from './voice';

class App {
    constructor() {
        this.chatInput = document.getElementById('chat-input');
        this.messages = [];
        this.init();
    }

    init() {
        console.log("Lira Frontend Initialized");
        this.setupListeners();
    }

    setupListeners() {
        // TODO: Add voice integration
    }
}`
  },
  {
    path: 'frontend/style.css',
    description: 'Tema, layout base e responsividade.',
    type: 'frontend',
    content: `/* Lira Styles */
body {
    background-color: #121212;
    color: #ffffff;
    font-family: 'Roboto', sans-serif;
}

.chat-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
}`
  },
  {
    path: 'backend/server.py',
    description: 'Rotas HTTP, sessões e comunicação com o frontend.',
    type: 'backend',
    content: `from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message')
    # Logic to process message
    return jsonify({"response": "Echo: " + user_message})

if __name__ == '__main__':
    app.run(port=5000)`
  },
  {
    path: 'backend/image_generator.py',
    description: 'Geração de imagens; providers; fallback.',
    type: 'backend',
    content: `import requests

class ImageGenerator:
    def __init__(self, provider="openai"):
        self.provider = provider

    def generate(self, prompt):
        # Placeholder for generation logic
        print(f"Generating image for: {prompt}")
        return "https://fake-url.com/image.png"
`
  },
  {
    path: 'backend/stt_engine.py',
    description: 'Processamento de áudio para texto.',
    type: 'backend',
    content: `# Speech to Text Engine
import speech_recognition as sr

def transcribe_audio(audio_file):
    recognizer = sr.Recognizer()
    # Processing logic here
    pass`
  },
  {
    path: 'lira_core/memory_manager.py',
    description: 'Gerencia como a Lira entende o próprio projeto.',
    type: 'core',
    content: `import json

class MemoryManager:
    def __init__(self, map_path="project_map.json"):
        self.map_path = map_path
        self.project_map = self._load_map()

    def _load_map(self):
        with open(self.map_path, 'r') as f:
            return json.load(f)

    def list_files(self):
        return list(self.project_map.keys())`
  },
  {
    path: 'lira_core/file_router.py',
    description: 'Decide qual arquivo deve ser alterado com base em uma solicitação.',
    type: 'core',
    content: `class FileRouter:
    def route(self, intent):
        # Logic to decide file based on intent
        pass`
  },
  {
    path: 'project_map.json',
    description: 'Arquivo de metadados com a lista dos principais arquivos.',
    type: 'config',
    content: `{
  "frontend/app.js": "Controle geral do chat, voz, input, fetch e rotina de mensagens.",
  "backend/image_generator.py": "Geração de imagens; providers; fallback."
}`
  }
];
