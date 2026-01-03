import { ProjectFile, RoutingResult } from '../types';
import { INITIAL_FILES } from '../constants';
import { GeminiService } from './geminiService';

// Simulated "Memory Manager"
export class LiraMemoryManager {
  private files: ProjectFile[];

  constructor() {
    this.files = [...INITIAL_FILES];
  }

  getFiles(): ProjectFile[] {
    return this.files;
  }

  getFile(path: string): ProjectFile | undefined {
    return this.files.find(f => f.path === path);
  }

  describe(path: string): string {
    const file = this.getFile(path);
    return file ? file.description : "Unknown file";
  }

  updateFileContent(path: string, newContent: string) {
    this.files = this.files.map(f =>
      f.path === path ? { ...f, content: newContent } : f
    );
  }
}

// Simulated "File Router" with Heuristics
export class LiraFileRouter {
  private memory: LiraMemoryManager;

  constructor(memory: LiraMemoryManager) {
    this.memory = memory;
  }

  determineTarget(userRequest: string): RoutingResult {
    const req = userRequest.toLowerCase();
    const files = this.memory.getFiles();

    // Heuristics based on prompt instructions
    let targetPath = '';
    let reasoning = '';
    let confidence = 0;

    if (req.includes('layout') || req.includes('css') || req.includes('color') || req.includes('style')) {
      targetPath = 'frontend/style.css';
      reasoning = "Detected keywords related to styling/layout. Routing to CSS.";
      confidence = 0.9;
    } else if (req.includes('voz') || req.includes('fala') || req.includes('microfone') || req.includes('audio')) {
      if (req.includes('stt') || req.includes('transcrever')) {
          targetPath = 'backend/stt_engine.py';
          reasoning = "Detected Speech-to-Text keywords.";
          confidence = 0.95;
      } else {
          targetPath = 'frontend/app.js';
          reasoning = "Detected generic voice/frontend interaction keywords.";
          confidence = 0.8;
      }
    } else if (req.includes('image') || req.includes('imagem') || req.includes('foto') || req.includes('gerar')) {
      targetPath = 'backend/image_generator.py';
      reasoning = "Detected image generation keywords. Priority: backend generator.";
      confidence = 0.95;
    } else if (req.includes('rota') || req.includes('api') || req.includes('endpoint')) {
      targetPath = 'backend/server.py';
      reasoning = "Detected API/Server routing keywords.";
      confidence = 0.9;
    } else if (req.includes('memoria') || req.includes('mapa') || req.includes('estrutura')) {
      targetPath = 'lira_core/memory_manager.py';
      reasoning = "Detected meta-system keywords regarding Lira's memory.";
      confidence = 0.9;
    } else {
        // Fallback or multiple match
        targetPath = 'lira_core/file_router.py';
        reasoning = "Request ambiguous. Routing to File Router logic for inspection or default.";
        confidence = 0.4;
    }

    const file = this.memory.getFile(targetPath);
    return {
      file: file || null,
      confidence,
      reasoning
    };
  }
}

// Enhanced "Patch Engine" with Real AI Integration
export class LiraPatchEngine {
  private geminiService?: GeminiService;

  constructor(geminiService?: GeminiService) {
    this.geminiService = geminiService;
  }

  async applyPatch(file: ProjectFile, instructions: string): Promise<string> {
    // If we have Gemini service, use real AI generation
    if (this.geminiService) {
      try {
        return await this.geminiService.generateCodePatch(file, instructions);
      } catch (error) {
        console.warn('Gemini API failed, falling back to simulation:', error);
        // Fall back to simulation if API fails
      }
    }

    // Fallback: Simulation mode
    const timestamp = new Date().toISOString().split('T')[0];

    let patch = '';
    if (file.path.endsWith('.py')) {
        patch = `\n\n# PATCH APPLIED: ${timestamp}\n# Intent: ${instructions}\n# PEP8 compliant update\ndef patch_update_${Date.now() % 1000}():\n    """\n    Auto-generated patch based on user request.\n    """\n    pass # Implemented logic would go here\n`;
    } else if (file.path.endsWith('.js') || file.path.endsWith('.ts')) {
         patch = `\n\n// PATCH APPLIED: ${timestamp}\n// Intent: ${instructions}\nfunction patchUpdate${Date.now() % 1000}() {\n    console.log("Patch applied for: ${instructions}");\n}\n`;
    } else if (file.path.endsWith('.css')) {
        patch = `\n\n/* PATCH APPLIED: ${timestamp} - ${instructions} */\n.patched-class-${Date.now() % 1000} {\n    /* Styles added */\n    visibility: visible;\n}\n`;
    } else {
        patch = `\n\n<!-- PATCH APPLIED: ${instructions} -->\n`;
    }

    return file.content + patch;
  }

  setGeminiService(service: GeminiService) {
    this.geminiService = service;
  }
}
