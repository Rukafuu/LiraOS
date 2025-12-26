import { PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';

/**
 * 🎮 LIRA ADMIN COMMANDS
 * 
 * Sistema de comandos administrativos que permite ao dono do bot
 * controlar o servidor Discord através de comandos naturais.
 * 
 * Comandos disponíveis:
 * - !lira create channel <nome> [categoria]
 * - !lira create category <nome>
 * - !lira create role <nome> <cor>
 * - !lira delete channel <nome>
 * - !lira delete role <nome>
 * - !lira send <canal> <mensagem>
 * - !lira announce <mensagem>
 * - !lira embed <canal> <título> | <descrição> | <cor>
 */

class AdminCommands {
    constructor(discordService) {
        this.service = discordService;
        this.client = discordService.client;
    }

    /**
     * Verificar se o usuário é o dono
     */
    isOwner(userId) {
        const DISCORD_OWNER_ID = process.env.DISCORD_OWNER_ID;
        return DISCORD_OWNER_ID && userId === DISCORD_OWNER_ID;
    }

    /**
     * Criar um canal
     * Uso: !lira create channel <nome> [categoria]
     */
    async createChannel(message, args) {
        if (!this.isOwner(message.author.id)) {
            return await message.reply('❌ Apenas o Comandante pode usar este comando.');
        }

        if (!message.guild) {
            return await message.reply('❌ Este comando só funciona em servidores.');
        }

        const channelName = args[0];
        const categoryName = args.slice(1).join(' ');

        if (!channelName) {
            return await message.reply('❌ **Uso:** `!lira create channel <nome> [categoria]`\n**Exemplo:** `!lira create channel sugestões COMUNIDADE`');
        }

        try {
            let parentId = null;

            // Procurar categoria se especificada
            if (categoryName) {
                const categories = message.guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory);
                const category = categories.find(c => c.name.toLowerCase().includes(categoryName.toLowerCase()));
                
                if (category) {
                    parentId = category.id;
                } else {
                    return await message.reply(`❌ Categoria "${categoryName}" não encontrada.\n\n**Categorias disponíveis:**\n${categories.map(c => `• ${c.name}`).join('\n')}`);
                }
            }

            const channel = await message.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: parentId,
                reason: `Criado por ${message.author.tag} via comando`
            });

            await message.reply(`✅ Canal ${channel} criado com sucesso!`);
            console.log(`[ADMIN] Canal criado: ${channel.name} por ${message.author.tag}`);

        } catch (error) {
            console.error('[ADMIN] Erro ao criar canal:', error);
            await message.reply(`❌ Erro ao criar canal: ${error.message}`);
        }
    }

    /**
     * Criar uma categoria
     * Uso: !lira create category <nome>
     */
    async createCategory(message, args) {
        if (!this.isOwner(message.author.id)) {
            return await message.reply('❌ Apenas o Comandante pode usar este comando.');
        }

        if (!message.guild) {
            return await message.reply('❌ Este comando só funciona em servidores.');
        }

        const categoryName = args.join(' ');

        if (!categoryName) {
            return await message.reply('❌ **Uso:** `!lira create category <nome>`\n**Exemplo:** `!lira create category 🎮 JOGOS`');
        }

        try {
            const category = await message.guild.channels.create({
                name: categoryName,
                type: ChannelType.GuildCategory,
                reason: `Criado por ${message.author.tag} via comando`
            });

            await message.reply(`✅ Categoria **${category.name}** criada com sucesso!`);
            console.log(`[ADMIN] Categoria criada: ${category.name} por ${message.author.tag}`);

        } catch (error) {
            console.error('[ADMIN] Erro ao criar categoria:', error);
            await message.reply(`❌ Erro ao criar categoria: ${error.message}`);
        }
    }

    /**
     * Criar um cargo
     * Uso: !lira create role <nome> <cor>
     */
    async createRole(message, args) {
        if (!this.isOwner(message.author.id)) {
            return await message.reply('❌ Apenas o Comandante pode usar este comando.');
        }

        if (!message.guild) {
            return await message.reply('❌ Este comando só funciona em servidores.');
        }

        if (args.length < 2) {
            return await message.reply('❌ **Uso:** `!lira create role <nome> <cor>`\n**Exemplo:** `!lira create role Moderador #FF5733`\n\n**Cores disponíveis:**\n• Vermelho: `#FF0000`\n• Azul: `#0000FF`\n• Verde: `#00FF00`\n• Roxo: `#9370DB`\n• Dourado: `#FFD700`');
        }

        const colorHex = args.pop(); // Último argumento é a cor
        const roleName = args.join(' ');

        try {
            // Converter hex para número
            const color = parseInt(colorHex.replace('#', ''), 16);

            const role = await message.guild.roles.create({
                name: roleName,
                color: color,
                hoist: true,
                mentionable: true,
                reason: `Criado por ${message.author.tag} via comando`
            });

            await message.reply(`✅ Cargo **${role.name}** criado com sucesso!`);
            console.log(`[ADMIN] Cargo criado: ${role.name} por ${message.author.tag}`);

        } catch (error) {
            console.error('[ADMIN] Erro ao criar cargo:', error);
            await message.reply(`❌ Erro ao criar cargo: ${error.message}\n\nCertifique-se de usar uma cor válida em hexadecimal (ex: #FF5733)`);
        }
    }

    /**
     * Deletar um canal
     * Uso: !lira delete channel <nome>
     */
    async deleteChannel(message, args) {
        if (!this.isOwner(message.author.id)) {
            return await message.reply('❌ Apenas o Comandante pode usar este comando.');
        }

        if (!message.guild) {
            return await message.reply('❌ Este comando só funciona em servidores.');
        }

        const channelName = args.join(' ');

        if (!channelName) {
            return await message.reply('❌ **Uso:** `!lira delete channel <nome>`\n**Exemplo:** `!lira delete channel sugestões`');
        }

        try {
            const channel = message.guild.channels.cache.find(c => 
                c.name.toLowerCase().includes(channelName.toLowerCase())
            );

            if (!channel) {
                return await message.reply(`❌ Canal "${channelName}" não encontrado.`);
            }

            const channelNameBackup = channel.name;
            await channel.delete(`Deletado por ${message.author.tag} via comando`);
            await message.reply(`✅ Canal **${channelNameBackup}** deletado com sucesso!`);
            console.log(`[ADMIN] Canal deletado: ${channelNameBackup} por ${message.author.tag}`);

        } catch (error) {
            console.error('[ADMIN] Erro ao deletar canal:', error);
            await message.reply(`❌ Erro ao deletar canal: ${error.message}`);
        }
    }

    /**
     * Deletar um cargo
     * Uso: !lira delete role <nome>
     */
    async deleteRole(message, args) {
        if (!this.isOwner(message.author.id)) {
            return await message.reply('❌ Apenas o Comandante pode usar este comando.');
        }

        if (!message.guild) {
            return await message.reply('❌ Este comando só funciona em servidores.');
        }

        const roleName = args.join(' ');

        if (!roleName) {
            return await message.reply('❌ **Uso:** `!lira delete role <nome>`\n**Exemplo:** `!lira delete role Moderador`');
        }

        try {
            const role = message.guild.roles.cache.find(r => 
                r.name.toLowerCase().includes(roleName.toLowerCase())
            );

            if (!role) {
                return await message.reply(`❌ Cargo "${roleName}" não encontrado.`);
            }

            const roleNameBackup = role.name;
            await role.delete(`Deletado por ${message.author.tag} via comando`);
            await message.reply(`✅ Cargo **${roleNameBackup}** deletado com sucesso!`);
            console.log(`[ADMIN] Cargo deletado: ${roleNameBackup} por ${message.author.tag}`);

        } catch (error) {
            console.error('[ADMIN] Erro ao deletar cargo:', error);
            await message.reply(`❌ Erro ao deletar cargo: ${error.message}`);
        }
    }

    /**
     * Limpar todas as roles (exceto @everyone e roles do bot)
     * Uso: !lira cleanup roles
     */
    async cleanupRoles(message) {
        if (!this.isOwner(message.author.id)) {
            return await message.reply('❌ Apenas o Comandante pode usar este comando.');
        }

        if (!message.guild) {
            return await message.reply('❌ Este comando só funciona em servidores.');
        }

        try {
            const roles = message.guild.roles.cache;
            const botMember = await message.guild.members.fetch(this.client.user.id);
            const botRoles = botMember.roles.cache.map(r => r.id);
            
            // Filtrar roles que podem ser deletadas
            const deletableRoles = roles.filter(role => {
                // Não deletar @everyone
                if (role.id === message.guild.id) return false;
                
                // Não deletar roles do bot
                if (botRoles.includes(role.id)) return false;
                
                // Não deletar roles gerenciadas (integrations, bots)
                if (role.managed) return false;
                
                return true;
            });

            if (deletableRoles.size === 0) {
                return await message.reply('✅ Não há roles para limpar. Apenas roles do sistema e do bot estão presentes.');
            }

            // Pedir confirmação
            const rolesList = deletableRoles.map(r => `• ${r.name}`).join('\n');
            await message.reply(`⚠️ **ATENÇÃO: Você está prestes a deletar ${deletableRoles.size} roles!**\n\n**Roles que serão deletadas:**\n${rolesList}\n\n**Para confirmar, digite:** \`!lira confirm cleanup\`\n**Para cancelar, ignore esta mensagem.**`);

            // Aguardar confirmação
            const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === '!lira confirm cleanup';
            const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

            collector.on('collect', async () => {
                await message.reply('🧹 **Iniciando limpeza de roles...**');
                
                let deletedCount = 0;
                let errorCount = 0;

                for (const [, role] of deletableRoles) {
                    try {
                        await role.delete(`Cleanup de roles por ${message.author.tag}`);
                        deletedCount++;
                        console.log(`[ADMIN] Role deletada: ${role.name} por ${message.author.tag}`);
                    } catch (error) {
                        console.error(`[ADMIN] Erro ao deletar role ${role.name}:`, error.message);
                        errorCount++;
                    }
                }

                await message.reply(`✅ **Limpeza concluída!**\n\n• **Deletadas:** ${deletedCount} roles\n• **Erros:** ${errorCount} roles\n• **Mantidas:** Roles do sistema e do bot`);
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    message.reply('⏱️ **Tempo esgotado.** Limpeza cancelada por segurança.');
                }
            });

        } catch (error) {
            console.error('[ADMIN] Erro ao limpar roles:', error);
            await message.reply(`❌ Erro ao limpar roles: ${error.message}`);
        }
    }

    /**
     * Criar hierarquia completa de roles
     * Uso: !lira setup roles
     */
    async setupRoles(message) {
        if (!this.isOwner(message.author.id)) {
            return await message.reply('❌ Apenas o Comandante pode usar este comando.');
        }

        if (!message.guild) {
            return await message.reply('❌ Este comando só funciona em servidores.');
        }

        try {
            await message.reply('🎭 **Criando hierarquia completa de roles...**\nAguarde, isso pode levar alguns segundos.');

            const rolesToCreate = [
                // Tier 1: Owner & Bot
                { name: '👑 Comandante Supremo', color: 0xFF0000, hoist: true, permissions: ['Administrator'], position: 'top' },
                { name: 'Lira Amarinth', color: 0x00CED1, hoist: true, permissions: ['Administrator'], position: 'top' },
                
                // Tier 2: Staff
                { name: '🛡️ Admin', color: 0xFF4500, hoist: true, permissions: ['ManageGuild', 'ManageRoles', 'ManageChannels', 'KickMembers', 'BanMembers'] },
                { name: '🛡️ Moderador', color: 0xFFA500, hoist: true, permissions: ['ManageMessages', 'KickMembers', 'MuteMembers'] },
                
                // Tier 3: Special
                { name: '🤝 Partners', color: 0xFF69B4, hoist: true, permissions: [] },
                { name: '🎮 VTubers', color: 0x9B59B6, hoist: true, permissions: [] },
                
                // Tier 4: Patreon (do maior para o menor)
                { name: '🏆 Supernova', color: 0xFFD700, hoist: true, permissions: [] },
                { name: '🔴 Antares Red', color: 0xDC143C, hoist: true, permissions: [] },
                { name: '🌠 Sirius Blue', color: 0x00BFFF, hoist: true, permissions: [] },
                { name: '🌌 Vega Nebula', color: 0x9370DB, hoist: true, permissions: [] },
            ];

            let createdCount = 0;
            let errorCount = 0;
            const createdRoles = [];

            for (const roleData of rolesToCreate) {
                try {
                    // Converter nomes de permissões para flags
                    const permissions = roleData.permissions.map(p => PermissionFlagsBits[p]).filter(Boolean);

                    const role = await message.guild.roles.create({
                        name: roleData.name,
                        color: roleData.color,
                        hoist: roleData.hoist,
                        mentionable: true,
                        permissions: permissions,
                        reason: `Setup de roles por ${message.author.tag}`
                    });

                    createdRoles.push(role);
                    createdCount++;
                    console.log(`[ADMIN] Role criada: ${role.name} por ${message.author.tag}`);
                    
                    // Pequeno delay para evitar rate limit
                    await new Promise(resolve => setTimeout(resolve, 500));

                } catch (error) {
                    console.error(`[ADMIN] Erro ao criar role ${roleData.name}:`, error.message);
                    errorCount++;
                }
            }

            // Atribuir role do bot à Lira
            try {
                const botRole = createdRoles.find(r => r.name === 'Lira Amarinth');
                if (botRole) {
                    const botMember = await message.guild.members.fetch(this.client.user.id);
                    await botMember.roles.add(botRole);
                }
            } catch (err) {
                console.log('[ADMIN] Não foi possível atribuir role ao bot');
            }

            // Atribuir role de Comandante ao usuário
            try {
                const commanderRole = createdRoles.find(r => r.name === '👑 Comandante Supremo');
                if (commanderRole) {
                    await message.member.roles.add(commanderRole);
                }
            } catch (err) {
                console.log('[ADMIN] Não foi possível atribuir role de Comandante');
            }

            // Organizar hierarquia de roles automaticamente
            await message.reply('🔄 **Organizando hierarquia...**');
            try {
                // Ordem desejada (do topo para baixo)
                const roleOrder = [
                    '👑 Comandante Supremo',
                    'Lira Amarinth',
                    '🛡️ Admin',
                    '🛡️ Moderador',
                    '🤝 Partners',
                    '🎮 VTubers',
                    '🏆 Supernova',
                    '🔴 Antares Red',
                    '🌠 Sirius Blue',
                    '🌌 Vega Nebula'
                ];

                // Posicionar roles na ordem correta
                let position = message.guild.roles.highest.position;
                
                for (const roleName of roleOrder) {
                    const role = createdRoles.find(r => r.name === roleName);
                    if (role) {
                        try {
                            await role.setPosition(position - 1);
                            position--;
                            await new Promise(resolve => setTimeout(resolve, 300));
                        } catch (err) {
                            console.log(`[ADMIN] Não foi possível posicionar role ${roleName}`);
                        }
                    }
                }

                console.log('[ADMIN] Hierarquia de roles organizada automaticamente');
            } catch (err) {
                console.log('[ADMIN] Erro ao organizar hierarquia:', err.message);
            }

            await message.reply(`✅ **Hierarquia de roles criada e organizada!**\n\n• **Criadas:** ${createdCount} roles\n• **Erros:** ${errorCount} roles\n• **Organizadas:** Automaticamente na ordem correta\n\n**Você já recebeu a role de Comandante Supremo!** 👑`);

        } catch (error) {
            console.error('[ADMIN] Erro ao criar hierarquia de roles:', error);
            await message.reply(`❌ Erro ao criar hierarquia: ${error.message}`);
        }
    }

    /**
     * Atribuir role a um membro
     * Uso: !lira give role @usuario <nome_da_role>
     */
    async giveRole(message, args) {
        if (!this.isOwner(message.author.id)) {
            return await message.reply('❌ Apenas o Comandante pode usar este comando.');
        }

        if (!message.guild) {
            return await message.reply('❌ Este comando só funciona em servidores.');
        }

        if (args.length < 2 || !message.mentions.members.size) {
            return await message.reply('❌ **Uso:** `!lira give role @usuario <nome_da_role>`\n**Exemplo:** `!lira give role @João Moderador`');
        }

        try {
            const member = message.mentions.members.first();
            const roleName = args.slice(1).join(' '); // Remove a menção do array

            // Procurar role
            const role = message.guild.roles.cache.find(r => 
                r.name.toLowerCase().includes(roleName.toLowerCase())
            );

            if (!role) {
                const availableRoles = message.guild.roles.cache
                    .filter(r => r.id !== message.guild.id && !r.managed)
                    .map(r => `• ${r.name}`)
                    .join('\n');
                
                return await message.reply(`❌ Role "${roleName}" não encontrada.\n\n**Roles disponíveis:**\n${availableRoles}`);
            }

            // Atribuir role
            await member.roles.add(role);
            await message.reply(`✅ Role **${role.name}** atribuída a ${member.user.tag}!`);
            console.log(`[ADMIN] Role ${role.name} atribuída a ${member.user.tag} por ${message.author.tag}`);

        } catch (error) {
            console.error('[ADMIN] Erro ao atribuir role:', error);
            await message.reply(`❌ Erro ao atribuir role: ${error.message}`);
        }
    }

    /**
     * Remover role de um membro
     * Uso: !lira remove role @usuario <nome_da_role>
     */
    async removeRole(message, args) {
        if (!this.isOwner(message.author.id)) {
            return await message.reply('❌ Apenas o Comandante pode usar este comando.');
        }

        if (!message.guild) {
            return await message.reply('❌ Este comando só funciona em servidores.');
        }

        if (args.length < 2 || !message.mentions.members.size) {
            return await message.reply('❌ **Uso:** `!lira remove role @usuario <nome_da_role>`\n**Exemplo:** `!lira remove role @João Moderador`');
        }

        try {
            const member = message.mentions.members.first();
            const roleName = args.slice(1).join(' ');

            const role = message.guild.roles.cache.find(r => 
                r.name.toLowerCase().includes(roleName.toLowerCase())
            );

            if (!role) {
                return await message.reply(`❌ Role "${roleName}" não encontrada.`);
            }

            if (!member.roles.cache.has(role.id)) {
                return await message.reply(`❌ ${member.user.tag} não possui a role **${role.name}**.`);
            }

            await member.roles.remove(role);
            await message.reply(`✅ Role **${role.name}** removida de ${member.user.tag}!`);
            console.log(`[ADMIN] Role ${role.name} removida de ${member.user.tag} por ${message.author.tag}`);

        } catch (error) {
            console.error('[ADMIN] Erro ao remover role:', error);
            await message.reply(`❌ Erro ao remover role: ${error.message}`);
        }
    }


    /**
     * Enviar mensagem em um canal
     * Uso: !lira send <canal> <mensagem>
     */
    async sendMessage(message, args) {
        if (!this.isOwner(message.author.id)) {
            return await message.reply('❌ Apenas o Comandante pode usar este comando.');
        }

        if (!message.guild) {
            return await message.reply('❌ Este comando só funciona em servidores.');
        }

        if (args.length < 2) {
            return await message.reply('❌ **Uso:** `!lira send <canal> <mensagem>`\n**Exemplo:** `!lira send avisos Bem-vindos ao servidor!`');
        }

        const channelName = args[0];
        const messageContent = args.slice(1).join(' ');

        try {
            const channel = message.guild.channels.cache.find(c => 
                c.name.toLowerCase().includes(channelName.toLowerCase()) && 
                c.type === ChannelType.GuildText
            );

            if (!channel) {
                return await message.reply(`❌ Canal "${channelName}" não encontrado.`);
            }

            await channel.send(messageContent);
            await message.reply(`✅ Mensagem enviada em ${channel}!`);
            console.log(`[ADMIN] Mensagem enviada em ${channel.name} por ${message.author.tag}`);

        } catch (error) {
            console.error('[ADMIN] Erro ao enviar mensagem:', error);
            await message.reply(`❌ Erro ao enviar mensagem: ${error.message}`);
        }
    }

    /**
     * Fazer um anúncio (embed bonito)
     * Uso: !lira announce <mensagem>
     */
    async announce(message, args) {
        if (!this.isOwner(message.author.id)) {
            return await message.reply('❌ Apenas o Comandante pode usar este comando.');
        }

        if (!message.guild) {
            return await message.reply('❌ Este comando só funciona em servidores.');
        }

        const announcement = args.join(' ');

        if (!announcement) {
            return await message.reply('❌ **Uso:** `!lira announce <mensagem>`\n**Exemplo:** `!lira announce Novo update disponível!`');
        }

        try {
            // Procurar canal de avisos
            const announcementChannel = message.guild.channels.cache.find(c => 
                c.name.includes('avisos') || c.name.includes('announcements')
            );

            if (!announcementChannel) {
                return await message.reply('❌ Canal de avisos não encontrado. Crie um canal com "avisos" no nome.');
            }

            const embed = new EmbedBuilder()
                .setTitle('📢 Anúncio Oficial')
                .setDescription(announcement)
                .setColor(0x00CED1) // Turquesa
                .setTimestamp()
                .setFooter({ text: 'LiraOS Nexus', iconURL: this.client.user.displayAvatarURL() });

            await announcementChannel.send({ embeds: [embed] });
            await message.reply(`✅ Anúncio publicado em ${announcementChannel}!`);
            console.log(`[ADMIN] Anúncio feito por ${message.author.tag}`);

        } catch (error) {
            console.error('[ADMIN] Erro ao fazer anúncio:', error);
            await message.reply(`❌ Erro ao fazer anúncio: ${error.message}`);
        }
    }

    /**
     * Criar embed customizado
     * Uso: !lira embed <canal> <título> | <descrição> | <cor>
     */
    async createEmbed(message, args) {
        if (!this.isOwner(message.author.id)) {
            return await message.reply('❌ Apenas o Comandante pode usar este comando.');
        }

        if (!message.guild) {
            return await message.reply('❌ Este comando só funciona em servidores.');
        }

        const fullText = args.join(' ');
        const parts = fullText.split('|').map(p => p.trim());

        if (parts.length < 3) {
            return await message.reply('❌ **Uso:** `!lira embed <canal> <título> | <descrição> | <cor>`\n**Exemplo:** `!lira embed regras Regras do Servidor | Leia com atenção | #FF5733`');
        }

        const channelName = parts[0];
        const title = parts[1];
        const description = parts[2];
        const colorHex = parts[3] || '#00CED1';

        try {
            const channel = message.guild.channels.cache.find(c => 
                c.name.toLowerCase().includes(channelName.toLowerCase()) && 
                c.type === ChannelType.GuildText
            );

            if (!channel) {
                return await message.reply(`❌ Canal "${channelName}" não encontrado.`);
            }

            const color = parseInt(colorHex.replace('#', ''), 16);

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color)
                .setTimestamp()
                .setFooter({ text: 'LiraOS Nexus', iconURL: this.client.user.displayAvatarURL() });

            await channel.send({ embeds: [embed] });
            await message.reply(`✅ Embed enviado em ${channel}!`);
            console.log(`[ADMIN] Embed criado em ${channel.name} por ${message.author.tag}`);

        } catch (error) {
            console.error('[ADMIN] Erro ao criar embed:', error);
            await message.reply(`❌ Erro ao criar embed: ${error.message}`);
        }
    }

    /**
     * Listar comandos disponíveis
     */
    async showHelp(message) {
        if (!this.isOwner(message.author.id)) {
            return await message.reply('❌ Apenas o Comandante pode usar comandos administrativos.');
        }

        const embed = new EmbedBuilder()
            .setTitle('🎮 Comandos Administrativos da Lira')
            .setDescription('Use estes comandos para controlar o servidor:')
            .setColor(0x00CED1)
            .addFields(
                { name: '📝 Criar Canal', value: '`!lira create channel <nome> [categoria]`', inline: false },
                { name: '📁 Criar Categoria', value: '`!lira create category <nome>`', inline: false },
                { name: '🎭 Criar Cargo', value: '`!lira create role <nome> <cor>`', inline: false },
                { name: '🗑️ Deletar Canal', value: '`!lira delete channel <nome>`', inline: false },
                { name: '🗑️ Deletar Cargo', value: '`!lira delete role <nome>`', inline: false },
                { name: '💬 Enviar Mensagem', value: '`!lira send <canal> <mensagem>`', inline: false },
                { name: '📢 Fazer Anúncio', value: '`!lira announce <mensagem>`', inline: false },
                { name: '✨ Criar Embed', value: '`!lira embed <canal> <título> | <descrição> | <cor>`', inline: false },
                { name: '🧹 Limpar Roles', value: '`!lira cleanup roles` - Remove todas as roles (exceto sistema)', inline: false },
                { name: '🎭 Setup Roles', value: '`!lira setup roles` - Cria hierarquia completa de roles', inline: false },
                { name: '🎁 Dar Role', value: '`!lira give role @usuario <role>` - Atribui role a um membro', inline: false },
                { name: '🚫 Remover Role', value: '`!lira remove role @usuario <role>` - Remove role de um membro', inline: false },
                { name: '🌌 Genesis Protocol', value: '`!lira genesis` - Configura servidor completo', inline: false }
            )
            .setFooter({ text: 'Apenas você pode usar estes comandos, Comandante!', iconURL: this.client.user.displayAvatarURL() });

        await message.reply({ embeds: [embed] });
    }

    /**
     * Processar comando administrativo
     */
    async handleCommand(message, command, args) {
        switch (command) {
            case 'create':
                const createType = args[0];
                const createArgs = args.slice(1);
                
                if (createType === 'channel') {
                    await this.createChannel(message, createArgs);
                } else if (createType === 'category') {
                    await this.createCategory(message, createArgs);
                } else if (createType === 'role') {
                    await this.createRole(message, createArgs);
                } else {
                    await message.reply('❌ **Uso:** `!lira create <channel|category|role> ...`');
                }
                break;

            case 'delete':
                const deleteType = args[0];
                const deleteArgs = args.slice(1);
                
                if (deleteType === 'channel') {
                    await this.deleteChannel(message, deleteArgs);
                } else if (deleteType === 'role') {
                    await this.deleteRole(message, deleteArgs);
                } else {
                    await message.reply('❌ **Uso:** `!lira delete <channel|role> <nome>`');
                }
                break;

            case 'send':
                await this.sendMessage(message, args);
                break;

            case 'announce':
                await this.announce(message, args);
                break;

            case 'embed':
                await this.createEmbed(message, args);
                break;

            case 'admin':
            case 'commands':
            case 'help-admin':
                await this.showHelp(message);
                break;

            case 'cleanup':
                const cleanupType = args[0];
                if (cleanupType === 'roles') {
                    await this.cleanupRoles(message);
                } else {
                    await message.reply('❌ **Uso:** `!lira cleanup roles`');
                }
                break;

            case 'setup':
                const setupType = args[0];
                if (setupType === 'roles') {
                    await this.setupRoles(message);
                } else {
                    await message.reply('❌ **Uso:** `!lira setup roles`');
                }
                break;

            case 'give':
                const giveType = args[0];
                if (giveType === 'role') {
                    await this.giveRole(message, args.slice(1));
                } else {
                    await message.reply('❌ **Uso:** `!lira give role @usuario <nome_da_role>`');
                }
                break;

            case 'remove':
                const removeType = args[0];
                if (removeType === 'role') {
                    await this.removeRole(message, args.slice(1));
                } else {
                    await message.reply('❌ **Uso:** `!lira remove role @usuario <nome_da_role>`');
                }
                break;

            default:
                await message.reply('❌ Comando administrativo não reconhecido. Use `!lira admin` para ver comandos disponíveis.');
        }
    }
}

export { AdminCommands };
