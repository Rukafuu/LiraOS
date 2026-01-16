import axios from 'axios';

/**
 * L.A.P Integration for Discord/WhatsApp
 * Allows users to execute autonomous agent tasks via chat
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

export class AgentIntegration {
    /**
     * Execute a task using L.A.P
     * @param {string} task - Task description
     * @param {string} userId - User ID for auth
     * @param {string} token - Auth token (optional)
     * @returns {Promise<{success: boolean, message: string, steps?: any[]}>}
     */
    static async executeTask(task, userId, token = null) {
        try {
            // 1. Plan the task
            console.log(`[AGENT] Planning task: "${task}"`);
            const planResponse = await axios.post(
                `${API_BASE_URL}/api/trae/plan`,
                { task },
                {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                    timeout: 30000 // 30s timeout
                }
            );

            if (!planResponse.data.success || !planResponse.data.plan) {
                return {
                    success: false,
                    message: '❌ Não consegui planejar essa tarefa.'
                };
            }

            const plan = planResponse.data.plan;
            console.log(`[AGENT] Plan generated with ${plan.length} steps`);

            // 2. Execute each step
            const results = [];
            for (let i = 0; i < plan.length; i++) {
                const step = plan[i];
                console.log(`[AGENT] Executing step ${i + 1}/${plan.length}: ${step.tool}`);

                try {
                    const execResponse = await axios.post(
                        `${API_BASE_URL}/api/trae/execute`,
                        {
                            tool: step.tool,
                            args: step.args || []
                        },
                        {
                            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                            timeout: 60000 // 60s timeout per step
                        }
                    );

                    results.push({
                        step: i + 1,
                        tool: step.tool,
                        description: step.description,
                        toolArgs: step.args,
                        success: execResponse.data.success,
                        result: execResponse.data.result,
                        error: execResponse.data.error
                    });

                    if (!execResponse.data.success) {
                        console.error(`[AGENT] Step ${i + 1} failed:`, execResponse.data.error);
                        break; // Stop on first error
                    }
                } catch (stepError) {
                    console.error(`[AGENT] Step ${i + 1} exception:`, stepError.message);
                    results.push({
                        step: i + 1,
                        tool: step.tool,
                        description: step.description,
                        toolArgs: step.args,
                        success: false,
                        error: stepError.message
                    });
                    break;
                }
            }

            // 3. Format response (Lakeview Style - Concise & Human Readable)
            let message = `**Tarefa Concluída!**\n`;
            
            for (const result of results) {
                const icon = result.success ? '✅' : '❌';
                let friendlyText = '';
                
                // Tool-specific friendly messages
                switch(result.tool) {
                    case 'readFile':
                        friendlyText = `📖 Li o arquivo \`${result.toolArgs?.[0] || '?'}\``;
                        if (result.success && result.result?.content) {
                            const lineCount = result.result.content.split('\n').length;
                            friendlyText += ` (${lineCount} linhas)`;
                        }
                        break;
                    case 'writeFile':
                        friendlyText = `💾 Salvei/Criei arquivo \`${result.toolArgs?.[0]}\``;
                        break;
                    case 'replaceInFile':
                        friendlyText = `📝 Editei o arquivo \`${result.toolArgs?.[0]}\``;
                        break;
                    case 'findFiles':
                        friendlyText = `🔍 Busquei arquivos com padrão \`${result.toolArgs?.[0]}\``;
                        if (result.success) friendlyText += ` (Encontrados: ${result.result?.count || 0})`;
                        break;
                    case 'runCommand':
                        friendlyText = `💻 Executei: \`${result.toolArgs?.[0]}\``;
                        break;
                    case 'think':
                        friendlyText = `🧠 *Pensando...*`;
                         if (result.toolArgs?.[0]) {
                            // Show thought but truncated
                            const thought = result.toolArgs[0];
                            const preview = thought.length > 100 ? thought.substring(0, 100) + '...' : thought;
                             friendlyText += `\n> _"${preview}"_`;
                        }
                        break;
                    default:
                        friendlyText = `🔧 ${result.description || result.tool}`;
                }

                message += `${icon} **${friendlyText}**\n`;
                
                // Show errors clearly
                if (!result.success && result.error) {
                    message += `   ⚠️ Erro: ${result.error}\n`;
                }
            }
            
            // Add final status summary
            const successCount = results.filter(r => r.success).length;
            const totalSteps = results.length;
            
            if (successCount === totalSteps) {
                message += `\n✨ **Todas as etapas foram concluídas com sucesso!**`;
            } else {
                message += `\n⚠️ **Tarefa finalizada com alertas** (${successCount}/${totalSteps} passos OK).`;
            }
            
            return {
                success: successCount === totalSteps,
                message,
                steps: results
            };

        } catch (error) {
            console.error('[AGENT] Task execution failed:', error.message);
            return {
                success: false,
                message: `❌ Erro ao executar tarefa: ${error.message}`
            };
        }
    }

    /**
     * Format task result for Discord/WhatsApp
     * Splits long messages if needed
     */
    static formatForChat(result, maxLength = 2000) {
        const { message } = result;
        
        if (message.length <= maxLength) {
            return [message];
        }

        // Split into chunks
        const chunks = [];
        let currentChunk = '';
        const lines = message.split('\n');

        for (const line of lines) {
            if ((currentChunk + line + '\n').length > maxLength) {
                chunks.push(currentChunk);
                currentChunk = line + '\n';
            } else {
                currentChunk += line + '\n';
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks;
    }
}

export default AgentIntegration;
