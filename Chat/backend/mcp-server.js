import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// Create MCP server
const server = new Server(
  {
    name: 'liraos-filesystem',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'read_file',
        description: 'Lê o conteúdo de um arquivo do projeto LiraOS',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Caminho relativo do arquivo (ex: backend/routes/chat.js)',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'list_directory',
        description: 'Lista arquivos e pastas em um diretório',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Caminho relativo do diretório (ex: backend/routes)',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'search_code',
        description: 'Busca por texto no código do projeto',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Texto a buscar',
            },
            file_pattern: {
              type: 'string',
              description: 'Padrão de arquivo (ex: *.js, *.tsx)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_file_info',
        description: 'Obtém informações sobre um arquivo (tamanho, última modificação, etc)',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Caminho relativo do arquivo',
            },
          },
          required: ['path'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'read_file': {
        const filePath = path.join(PROJECT_ROOT, args.path);
        const content = await fs.readFile(filePath, 'utf-8');
        return {
          content: [
            {
              type: 'text',
              text: `Arquivo: ${args.path}\n\n${content}`,
            },
          ],
        };
      }

      case 'list_directory': {
        const dirPath = path.join(PROJECT_ROOT, args.path || '');
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const list = entries.map(entry => ({
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
        }));
        return {
          content: [
            {
              type: 'text',
              text: `Diretório: ${args.path || '/'}\n\n${JSON.stringify(list, null, 2)}`,
            },
          ],
        };
      }

      case 'search_code': {
        // Simple grep-like search
        const results = [];
        const searchDir = async (dir) => {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                await searchDir(fullPath);
              }
            } else if (entry.isFile()) {
              if (args.file_pattern) {
                const pattern = args.file_pattern.replace('*', '.*');
                if (!new RegExp(pattern).test(entry.name)) continue;
              }
              try {
                const content = await fs.readFile(fullPath, 'utf-8');
                const lines = content.split('\n');
                lines.forEach((line, idx) => {
                  if (line.includes(args.query)) {
                    results.push({
                      file: path.relative(PROJECT_ROOT, fullPath),
                      line: idx + 1,
                      content: line.trim(),
                    });
                  }
                });
              } catch (e) {
                // Skip binary files
              }
            }
          }
        };
        await searchDir(PROJECT_ROOT);
        return {
          content: [
            {
              type: 'text',
              text: `Busca por: "${args.query}"\n\nResultados:\n${JSON.stringify(results.slice(0, 50), null, 2)}`,
            },
          ],
        };
      }

      case 'get_file_info': {
        const filePath = path.join(PROJECT_ROOT, args.path);
        const stats = await fs.stat(filePath);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                path: args.path,
                size: stats.size,
                modified: stats.mtime,
                created: stats.birthtime,
                isDirectory: stats.isDirectory(),
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('LiraOS MCP Filesystem Server running');
}

main().catch(console.error);
