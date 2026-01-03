export interface ProjectFile {
  path: string;
  description: string;
  content: string;
  type: 'core' | 'backend' | 'frontend' | 'config';
}

export interface ProjectMap {
  [path: string]: string; // path -> description mapping
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error' | 'system';
  message: string;
  details?: string;
}

export type RoutingResult = {
  file: ProjectFile | null;
  confidence: number;
  reasoning: string;
};
