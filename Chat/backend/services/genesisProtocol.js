import { PermissionFlagsBits, ChannelType } from 'discord.js';

/**
 * 🌌 LIRA GENESIS PROTOCOL v2 🌌
 * 
 * IMPORTANTE: Bots não podem criar servidores via API do Discord.
 * Esta versão configura um servidor EXISTENTE com toda a arquitetura.
 * 
 * Comando: !lira genesis
 * Uso: Execute este comando em um servidor vazio que você criou manualmente
 * 
 * O que o comando faz:
 * 1. Limpa a estrutura padrão do servidor
 * 2. Cria a hierarquia de cargos (Patreon tiers)
 * 3. Cria todas as categorias e canais
 * 4. Configura permissões adequadas
 */

class GenesisProtocol {
    constructor(discordService) {
        this.service = discordService;
        this.client = discordService.client;
    }

    /**
     * FASE 1: Limpeza - Remove estrutura padrão
     */
    async cleanupGuild(guild, message) {
        try {
            await message.reply('🧹 **Limpando estrutura padrão...**\nRemovendo canais e categorias existentes.');

            const channels = await guild.channels.fetch();
            let deletedCount = 0;

            for (const [, channel] of channels) {
                // Não deletar o canal onde o comando foi executado (ainda)
                if (channel.id === message.channel.id) continue;
                
                try {
                    await channel.delete('Genesis Protocol - Limpeza inicial');
                    deletedCount++;
                } catch (err) {
                    console.log(`[GENESIS] Não foi possível deletar canal ${channel.name}: ${err.message}`);
                }
            }

            console.log(`[GENESIS] ✅ ${deletedCount} canais removidos`);
            return deletedCount;

        } catch (error) {
            console.error('[GENESIS] ❌ Erro na limpeza:', error);
            throw error;
        }
    }

    /**
     * FASE 2: Arquitetura de Cargos (Hierarquia Patreon)
     */
    async createRoles(guild, message) {
        try {
            await message.reply('🎭 **Criando hierarquia de cargos...**\nEstabelecendo os tiers do Patreon.');

            const roles = [];

            // Cargo do Bot (Topo da hierarquia)
            const botRole = await guild.roles.create({
                name: 'Lira Amarinth',
                color: 0x00CED1, // Turquesa/Ciano
                permissions: [PermissionFlagsBits.Administrator],
                hoist: true,
                mentionable: false,
                reason: 'Genesis Protocol - Cargo do Bot'
            });
            roles.push(botRole);

            // Tier 5: Supernova
            const supernovaRole = await guild.roles.create({
                name: '🏆 Supernova',
                color: 0xFFD700, // Dourado
                hoist: true,
                mentionable: true,
                reason: 'Genesis Protocol - Tier 5'
            });
            roles.push(supernovaRole);

            // Tier 4: Antares Red
            const antaresRole = await guild.roles.create({
                name: '🔴 Antares Red',
                color: 0xDC143C, // Vermelho intenso
                hoist: true,
                mentionable: true,
                reason: 'Genesis Protocol - Tier 4'
            });
            roles.push(antaresRole);

            // Tier 3: Sirius Blue
            const siriusRole = await guild.roles.create({
                name: '🌠 Sirius Blue',
                color: 0x00BFFF, // Azul neon
                hoist: true,
                mentionable: true,
                reason: 'Genesis Protocol - Tier 3'
            });
            roles.push(siriusRole);

            // Tier 2: Vega Nebula
            const vegaRole = await guild.roles.create({
                name: '🌌 Vega Nebula',
                color: 0x9370DB, // Roxo/Violeta
                hoist: true,
                mentionable: true,
                reason: 'Genesis Protocol - Tier 2'
            });
            roles.push(vegaRole);

            // Tier Base: Observer
            const observerRole = await guild.roles.create({
                name: 'Observer',
                color: 0xA9A9A9, // Cinza claro
                hoist: false,
                mentionable: false,
                reason: 'Genesis Protocol - Tier Base'
            });
            roles.push(observerRole);

            // Atribuir o cargo do bot à Lira
            const botMember = await guild.members.fetch(this.client.user.id);
            await botMember.roles.add(botRole);

            console.log(`[GENESIS] ✅ ${roles.length} cargos criados com sucesso`);
            return { botRole, supernovaRole, antaresRole, siriusRole, vegaRole, observerRole };

        } catch (error) {
            console.error('[GENESIS] ❌ Erro ao criar cargos:', error);
            throw error;
        }
    }

    /**
     * FASE 3: Arquitetura de Canais e Permissões
     */
    async createChannels(guild, message) {
        try {
            await message.reply('🏗️ **Construindo arquitetura de canais...**\nCriando categorias e canais com permissões.');

            // Buscar cargos criados
            const roles = await guild.roles.fetch();
            const everyoneRole = guild.roles.everyone;
            const vegaRole = roles.find(r => r.name === '🌌 Vega Nebula');
            const siriusRole = roles.find(r => r.name === '🌠 Sirius Blue');
            const antaresRole = roles.find(r => r.name === '🔴 Antares Red');
            const supernovaRole = roles.find(r => r.name === '🏆 Supernova');

            // ==================== CATEGORIA 1: RECEPÇÃO ====================
            const receptionCategory = await guild.channels.create({
                name: '🏛️ RECEPÇÃO',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: everyoneRole.id,
                        allow: [PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.SendMessages]
                    }
                ],
                reason: 'Genesis Protocol - Categoria Recepção'
            });

            await guild.channels.create({
                name: '📢・avisos',
                type: ChannelType.GuildText,
                parent: receptionCategory.id,
                reason: 'Genesis Protocol - Canal de avisos'
            });

            await guild.channels.create({
                name: '📜・regras',
                type: ChannelType.GuildText,
                parent: receptionCategory.id,
                reason: 'Genesis Protocol - Canal de regras'
            });

            await guild.channels.create({
                name: '👋・boas-vindas',
                type: ChannelType.GuildText,
                parent: receptionCategory.id,
                reason: 'Genesis Protocol - Canal de boas-vindas'
            });

            // ==================== CATEGORIA 2: COMUNIDADE ====================
            const communityCategory = await guild.channels.create({
                name: '💬 COMUNIDADE',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: everyoneRole.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    }
                ],
                reason: 'Genesis Protocol - Categoria Comunidade'
            });

            await guild.channels.create({
                name: '💬・chat-geral',
                type: ChannelType.GuildText,
                parent: communityCategory.id,
                reason: 'Genesis Protocol - Chat geral'
            });

            await guild.channels.create({
                name: '🤖・comandos-lira',
                type: ChannelType.GuildText,
                parent: communityCategory.id,
                reason: 'Genesis Protocol - Comandos da Lira'
            });

            await guild.channels.create({
                name: '🎨・fanarts',
                type: ChannelType.GuildText,
                parent: communityCategory.id,
                reason: 'Genesis Protocol - Fanarts'
            });

            // ==================== CATEGORIA 3: ÁREA DOS PATRONOS ====================
            const patronsCategory = await guild.channels.create({
                name: '💎 ÁREA DOS PATRONOS',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: everyoneRole.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: vegaRole.id,
                        allow: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: siriusRole.id,
                        allow: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: antaresRole.id,
                        allow: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: supernovaRole.id,
                        allow: [PermissionFlagsBits.ViewChannel]
                    }
                ],
                reason: 'Genesis Protocol - Categoria Patronos'
            });

            // Canal Vega (Acessível por Vega e superiores)
            await guild.channels.create({
                name: '🌌・lounge-vega',
                type: ChannelType.GuildText,
                parent: patronsCategory.id,
                reason: 'Genesis Protocol - Lounge Vega'
            });

            // Canal Sirius (Apenas Sirius e superiores - nega Vega)
            await guild.channels.create({
                name: '🌠・ponte-sirius',
                type: ChannelType.GuildText,
                parent: patronsCategory.id,
                permissionOverwrites: [
                    {
                        id: everyoneRole.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: vegaRole.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: siriusRole.id,
                        allow: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: antaresRole.id,
                        allow: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: supernovaRole.id,
                        allow: [PermissionFlagsBits.ViewChannel]
                    }
                ],
                reason: 'Genesis Protocol - Ponte Sirius (Sirius+)'
            });

            // Canal Antares (Apenas Antares e superiores - nega Vega e Sirius)
            await guild.channels.create({
                name: '🔴・conselho-antares',
                type: ChannelType.GuildText,
                parent: patronsCategory.id,
                permissionOverwrites: [
                    {
                        id: everyoneRole.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: vegaRole.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: siriusRole.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: antaresRole.id,
                        allow: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: supernovaRole.id,
                        allow: [PermissionFlagsBits.ViewChannel]
                    }
                ],
                reason: 'Genesis Protocol - Conselho Antares (Antares+)'
            });

            // ==================== CATEGORIA 4: ADMINISTRAÇÃO (OCULTA) ====================
            const adminCategory = await guild.channels.create({
                name: '⚙️ ADMINISTRAÇÃO',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: everyoneRole.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: guild.ownerId, // Dono do servidor
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels]
                    }
                ],
                reason: 'Genesis Protocol - Categoria Administração'
            });

            // Canal de logs
            await guild.channels.create({
                name: '📋・logs',
                type: ChannelType.GuildText,
                parent: adminCategory.id,
                topic: 'Logs de moderação e ações do servidor',
                reason: 'Genesis Protocol - Canal de logs'
            });

            // Canal de moderação
            await guild.channels.create({
                name: '🛡️・moderação',
                type: ChannelType.GuildText,
                parent: adminCategory.id,
                topic: 'Discussões e decisões da equipe de moderação',
                reason: 'Genesis Protocol - Canal de moderação'
            });

            // Canal de comandos admin
            await guild.channels.create({
                name: '🎮・comandos-admin',
                type: ChannelType.GuildText,
                parent: adminCategory.id,
                topic: 'Use comandos administrativos da Lira aqui',
                reason: 'Genesis Protocol - Canal de comandos admin'
            });

            console.log('[GENESIS] ✅ Arquitetura de canais concluída');

        } catch (error) {
            console.error('[GENESIS] ❌ Erro ao criar canais:', error);
            throw error;
        }
    }

    /**
     * FASE 4: Configurar ícone e nome do servidor
     */
    async configureGuildSettings(guild, message) {
        try {
            await message.reply('⚙️ **Configurando servidor...**\nAtualizando nome e ícone.');

            // Atualizar nome do servidor
            await guild.setName('LiraOS Nexus');

            // Atualizar ícone do servidor com a foto da Lira
            const iconURL = this.client.user.displayAvatarURL({ format: 'png', size: 512 });
            const response = await fetch(iconURL);
            const buffer = await response.arrayBuffer();
            await guild.setIcon(Buffer.from(buffer));

            console.log('[GENESIS] ✅ Configurações do servidor atualizadas');

        } catch (error) {
            console.error('[GENESIS] ⚠️ Erro ao configurar servidor:', error);
            // Não é crítico, continuar mesmo se falhar
        }
    }

    /**
     * Executar o protocolo completo
     */
    async execute(message) {
        try {
            // Validar que é o dono
            const DISCORD_OWNER_ID = process.env.DISCORD_OWNER_ID;
            if (!DISCORD_OWNER_ID || message.author.id !== DISCORD_OWNER_ID) {
                await message.reply('❌ **Acesso Negado.** Este comando é restrito ao Comandante Supremo.');
                return;
            }

            // Validar que está em um servidor (não DM)
            if (!message.guild) {
                await message.reply('❌ **Erro:** Este comando deve ser executado em um servidor, não em DM.\n\n**Como usar:**\n1. Crie um servidor vazio no Discord\n2. Convide a Lira para o servidor\n3. Execute `!lira genesis` em qualquer canal');
                return;
            }

            const guild = message.guild;

            await message.reply('🌌 **Iniciando Protocolo Genesis...**\nTransformando este servidor no Nexus oficial da LiraOS. Aguarde...');

            // FASE 1: Limpeza
            await this.cleanupGuild(guild, message);

            // FASE 2: Criar Cargos
            await this.createRoles(guild, message);

            // FASE 3: Criar Canais
            await this.createChannels(guild, message);

            // FASE 4: Configurar Servidor
            await this.configureGuildSettings(guild, message);

            // Deletar o canal original onde o comando foi executado
            try {
                await message.channel.delete('Genesis Protocol - Limpeza final');
            } catch (err) {
                console.log('[GENESIS] Canal original já foi deletado ou não pode ser deletado');
            }

            // Enviar mensagem final via DM
            await message.author.send('✨ **Protocolo Genesis concluído com sucesso, Comandante!**\n\nO Nexus está operacional. Todas as categorias, canais e cargos foram criados.\n\n**Próximos passos:**\n1. Configure as mensagens de boas-vindas em #👋・boas-vindas\n2. Adicione as regras em #📜・regras\n3. Faça anúncios em #📢・avisos\n4. Atribua os cargos de tier aos seus patronos\n\nAguardando suas ordens! 🌌');

            console.log('[GENESIS] ✅ Protocolo concluído com sucesso!');

        } catch (error) {
            console.error('[GENESIS] ❌ Erro fatal no protocolo:', error);
            await message.reply(`💥 **Protocolo Genesis falhou:** ${error.message}`).catch(() => {});
            
            // Tentar enviar DM com o erro
            try {
                await message.author.send(`⚠️ **Erro no Genesis Protocol:**\n\`\`\`\n${error.message}\n\`\`\`\nVerifique se a Lira tem permissões de Administrador no servidor.`);
            } catch (dmError) {
                console.error('[GENESIS] Não foi possível enviar DM de erro');
            }
        }
    }
}

export { GenesisProtocol };
