import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Lira MCP Service (Model Context Protocol)
 * Manages connections to external tool servers
 */
class MCPService {
    constructor() {
        this.servers = new Map(); // name -> server object
        this.tools = []; // Array of all tools from all servers
    }

    /**
     * Initializes the MCP system
     * Checks for configured servers in env or config file
     */
    async init() {
        console.log('[MCP] 🔌 Initializing Model Context Protocol...');
        
        // Example: Auto-loading servers from persistent config or ENV
        // For now, let's keep it manual via method calls
        
        return true;
    }

    /**
     * Registers and starts an MCP server via stdio
     * @param {string} name - Internal name for the server
     * @param {string} command - Binary/script to run (e.g. 'node')
     * @param {string[]} args - Arguments (e.g. ['server.js'])
     * @param {Object} env - Optional environment variables
     */
    async registerServer(name, command, args, env = {}) {
        if (this.servers.has(name)) {
            console.log(`[MCP] Server ${name} already registered.`);
            return;
        }

        console.log(`[MCP] 🚀 Starting server: ${name}...`);
        
        const proc = spawn(command, args, {
            env: { ...process.env, ...env },
            stdio: ['pipe', 'pipe', 'inherit'] // pipe stdin/stdout, inherit stderr for logs
        });

        const server = {
            name,
            proc,
            pendingRequests: new Map(), // id -> {resolve, reject}
            capabilities: {},
            tools: []
        };

        // Listen for output (JSON-RPC)
        proc.stdout.on('data', (data) => this._handleData(server, data));

        proc.on('error', (err) => {
            console.error(`[MCP] ❌ Server ${name} error:`, err);
        });

        proc.on('close', (code) => {
            console.warn(`[MCP] ⚠️ Server ${name} closed with code: ${code}`);
            this.servers.delete(name);
            this._refreshToolList();
        });

        this.servers.set(name, server);

        // Initial Handshake / List Tools
        try {
            await this._handshake(server);
            await this.refreshTools(name);
            console.log(`[MCP] ✅ Server ${name} ready with ${server.tools.length} tools.`);
        } catch (err) {
            console.error(`[MCP] ❌ Handshake failed for ${name}:`, err.message);
        }
    }

    async _handshake(server) {
        // Most MCP servers expect an initialize call
        const response = await this._sendRequest(server, 'initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'LiraOS', version: '2.0.0' }
        });
        server.capabilities = response.capabilities || {};
        
        // Signal initialized
        this._sendNotification(server, 'notifications/initialized', {});
    }

    async refreshTools(serverName) {
        const server = this.servers.get(serverName);
        if (!server) return;

        const response = await this._sendRequest(server, 'tools/list', {});
        server.tools = response.tools || [];
        this._refreshToolList();
    }

    /**
     * Returns tools formatted for Google Gemini API
     * and sanitizes schemas to match Gemini's OpenAPI subset.
     */
    getGeminiTools() {
        return this.tools.map(tool => {
            // Clone deeply to avoid mutating internal tools state
            const parameters = tool.inputSchema ? JSON.parse(JSON.stringify(tool.inputSchema)) : { type: 'object', properties: {} };
            this._sanitizeSchemaForGemini(parameters);

            return {
                name: tool.name,
                description: tool.description,
                parameters,
                _server: tool._server // Keep server name for tier-based filtering
            };
        });
    }

    /**
     * Recursively removes JSON schema keys not supported by Google Gemini.
     */
    _sanitizeSchemaForGemini(schema) {
        if (!schema || typeof schema !== 'object') return;
        
        if (Array.isArray(schema)) {
            schema.forEach(item => this._sanitizeSchemaForGemini(item));
        } else {
            delete schema['$schema'];
            delete schema['additionalProperties'];
            
            for (const key of Object.keys(schema)) {
                this._sanitizeSchemaForGemini(schema[key]);
            }
        }
    }

    _refreshToolList() {
        const allTools = [];
        for (const server of this.servers.values()) {
            allTools.push(...server.tools.map(t => ({
                ...t,
                _server: server.name // internal tracking
            })));
        }
        this.tools = allTools;
    }

    /**
     * Executes a tool from a specific server
     */
    async callTool(name, args) {
        const tool = this.tools.find(t => t.name === name);
        if (!tool) throw new Error(`Tool ${name} not found in any MCP server`);

        const server = this.servers.get(tool._server);
        if (!server) throw new Error(`MCP Server ${tool._server} is offline`);

        console.log(`[MCP] 🛠️ Calling tool ${name} on server ${server.name}...`);
        
        const result = await this._sendRequest(server, 'tools/call', {
            name,
            arguments: args
        });

        // 🧠 AI Optimization: Extract text for easier consumption
        if (result.content && Array.isArray(result.content)) {
            return result.content.map(c => c.text || JSON.stringify(c)).join('\n');
        }

        return result;
    }

    // --- JSON-RPC PLUMBING ---

    _handleData(server, data) {
        const lines = data.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
            try {
                const message = JSON.parse(line);
                
                // Handle Response
                if (message.id && (message.result !== undefined || message.error !== undefined)) {
                    const pending = server.pendingRequests.get(message.id);
                    if (pending) {
                        if (message.error) pending.reject(message.error);
                        else pending.resolve(message.result);
                        server.pendingRequests.delete(message.id);
                    }
                }
                // Handle Request/Notification (coming from server) - Skip for now
            } catch (e) {
                // Not JSON or partial? MCP stdio should be line-delimited JSON.
            }
        }
    }

    _sendRequest(server, method, params) {
        return new Promise((resolve, reject) => {
            const id = uuidv4();
            const request = { jsonrpc: '2.0', id, method, params };
            
            server.pendingRequests.set(id, { resolve, reject });
            
            // Timeout safety
            setTimeout(() => {
                if (server.pendingRequests.has(id)) {
                    server.pendingRequests.delete(id);
                    reject(new Error(`MCP Request ${method} timed out`));
                }
            }, 30000);

            server.proc.stdin.write(JSON.stringify(request) + '\n');
        });
    }

    _sendNotification(server, method, params) {
        const notification = { jsonrpc: '2.0', method, params };
        server.proc.stdin.write(JSON.stringify(notification) + '\n');
    }
}

export const mcpService = new MCPService();
