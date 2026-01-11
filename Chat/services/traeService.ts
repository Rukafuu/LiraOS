import { apiFetch } from './apiClient';
import { getAuthHeaders } from './userService';
import { API_BASE_URL } from '../src/config';

export interface TraeTool {
  name: string;
  category: string;
  description?: string;
}

export interface TraeResponse<T = any> {
  success: boolean;
  result?: T;
  error?: string;
  output?: string;
}

const BASE_URL = `${API_BASE_URL}/api/trae`;

/**
 * Trae Mode Service - Client SDK for Agentic Capabilities
 * Provides access to backend tools: File System, Git, Execution, Analysis
 */
export const traeService = {
  /**
   * List all available tools and categories
   */
  getTools: async (): Promise<TraeResponse<{ tools: string[], categories: Record<string, string[]> }>> => {
    try {
      const res = await apiFetch(`${BASE_URL}/tools`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Execute a single tool
   */
  executeTool: async (tool: string, args: any[] = []): Promise<TraeResponse> => {
    try {
      const res = await apiFetch(`${BASE_URL}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ tool, args })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Execute multiple tools in sequence or parallel (backend handles logic)
   */
  executeBatch: async (operations: { tool: string, args: any[] }[]): Promise<TraeResponse> => {
    try {
      const res = await apiFetch(`${BASE_URL}/execute-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ operations })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Search within the codebase
   */
  searchCode: async (query: string, path: string = '.', options: any = {}): Promise<TraeResponse> => {
    try {
      const res = await apiFetch(`${BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ query, path, options })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Analyze a file's structure (outline)
   */
  analyzeFile: async (filePath: string): Promise<TraeResponse> => {
    try {
      const res = await apiFetch(`${BASE_URL}/analyze-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ filePath })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Get project information and structure
   */
  getProjectInfo: async (): Promise<TraeResponse> => {
    try {
      const res = await apiFetch(`${BASE_URL}/project-info`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Plan a task using AI
   */
  planTask: async (task: string): Promise<TraeResponse<{ tool: string, args: any[], description: string }[]>> => {
    try {
      const res = await apiFetch(`${BASE_URL}/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ task })
      });
      const data = await res.json();
      // Backend returns { success: true, plan: [...] }
      // We map 'plan' to 'result' to match TraeResponse interface if needed, or just return data
      if (data.success && data.plan) {
          return { success: true, result: data.plan };
      }
      return data;
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Check API health and feature status
   */
  healthCheck: async (): Promise<TraeResponse> => {
    try {
      const res = await apiFetch(`${BASE_URL}/health`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
};
