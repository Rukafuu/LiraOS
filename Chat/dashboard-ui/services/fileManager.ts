// File Manager - Gerenciamento seguro de arquivos com backup e rollback
import { promises as fs } from 'fs';
import * as path from 'path';

export interface FileChange {
  filePath: string;
  originalContent: string;
  newContent: string;
  timestamp: Date;
  approved: boolean;
  backupPath?: string;
}

export class FileManager {
  private backupDir: string;

  constructor(backupDir = './backups') {
    this.backupDir = backupDir;
  }

  // Cria backup do arquivo atual
  async createBackup(filePath: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = path.basename(filePath);
      const backupPath = path.join(this.backupDir, `${fileName}.bak.${timestamp}`);

      // Garante que o diretório de backup existe
      await fs.mkdir(path.dirname(backupPath), { recursive: true });

      // Lê o conteúdo atual
      const currentContent = await fs.readFile(filePath, 'utf-8');

      // Cria backup
      await fs.writeFile(backupPath, currentContent, 'utf-8');

      return backupPath;
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      throw new Error('Falha ao criar backup do arquivo');
    }
  }

  // Aplica mudança no arquivo (com backup automático)
  async applyChange(change: FileChange): Promise<void> {
    try {
      // Cria backup primeiro
      const backupPath = await this.createBackup(change.filePath);
      change.backupPath = backupPath;

      // Aplica a mudança
      await fs.writeFile(change.filePath, change.newContent, 'utf-8');

      console.log(`Arquivo ${change.filePath} atualizado com sucesso. Backup: ${backupPath}`);
    } catch (error) {
      console.error('Erro ao aplicar mudança:', error);
      throw new Error('Falha ao aplicar mudança no arquivo');
    }
  }

  // Restaura backup
  async rollback(filePath: string, backupPath: string): Promise<void> {
    try {
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      await fs.writeFile(filePath, backupContent, 'utf-8');
      console.log(`Rollback realizado: ${filePath} restaurado de ${backupPath}`);
    } catch (error) {
      console.error('Erro no rollback:', error);
      throw new Error('Falha ao restaurar backup');
    }
  }

  // Lista backups disponíveis para um arquivo
  async listBackups(filePath: string): Promise<string[]> {
    try {
      const fileName = path.basename(filePath);
      const files = await fs.readdir(this.backupDir);
      return files
        .filter(f => f.startsWith(`${fileName}.bak.`))
        .sort()
        .reverse(); // Mais recentes primeiro
    } catch (error) {
      console.error('Erro ao listar backups:', error);
      return [];
    }
  }

  // Simula aplicação (para desenvolvimento/testing)
  async simulateChange(change: FileChange): Promise<void> {
    console.log(`[SIMULAÇÃO] Aplicando mudança em ${change.filePath}`);
    console.log(`[SIMULAÇÃO] Backup seria criado em: ${change.backupPath || 'simulado'}`);
    console.log(`[SIMULAÇÃO] Novo conteúdo (${change.newContent.length} caracteres)`);

    // Em simulação, não modifica arquivos reais
    change.approved = true;
  }
}

// Instância global para desenvolvimento
export const fileManager = new FileManager();
