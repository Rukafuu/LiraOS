import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 🎨 PATREON SERVICE
 * 
 * Serviço de integração com a API do Patreon v2
 * 
 * Funcionalidades:
 * - Buscar patronos ativos
 * - Verificar tier de um patrono
 * - Atualizar tokens automaticamente
 * - Sincronizar com roles do Discord
 */

class PatreonService {
    constructor() {
        this.clientId = process.env.PATREON_CLIENT_ID;
        this.clientSecret = process.env.PATREON_CLIENT_SECRET;
        this.accessToken = process.env.PATREON_CREATOR_ACCESS_TOKEN;
        this.refreshToken = process.env.PATREON_CREATOR_REFRESH_TOKEN;
        this.campaignId = process.env.PATREON_CAMPAIGN_ID;
        
        this.baseURL = 'https://www.patreon.com/api/oauth2/v2';
        
        // Mapeamento de tiers do Patreon para roles do Discord
        this.tierMapping = {
            'vega': '🌌 Vega Nebula',
            'sirius': '🌠 Sirius Blue',
            'antares': '🔴 Antares Red',
            'supernova': '🏆 Supernova'
        };

        console.log('[PATREON] Serviço inicializado');
    }

    /**
     * Fazer requisição à API do Patreon
     */
    async makeRequest(endpoint, params = {}) {
        try {
            const response = await axios.get(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                params
            });

            return response.data;
        } catch (error) {
            // Se o token expirou, tentar renovar
            if (error.response?.status === 401) {
                console.log('[PATREON] Token expirado, renovando...');
                await this.refreshAccessToken();
                
                // Tentar novamente com o novo token
                const response = await axios.get(`${this.baseURL}${endpoint}`, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    params
                });

                return response.data;
            }

            throw error;
        }
    }

    /**
     * Renovar access token usando refresh token
     */
    async refreshAccessToken() {
        try {
            const response = await axios.post('https://www.patreon.com/api/oauth2/token', {
                grant_type: 'refresh_token',
                refresh_token: this.refreshToken,
                client_id: this.clientId,
                client_secret: this.clientSecret
            });

            this.accessToken = response.data.access_token;
            this.refreshToken = response.data.refresh_token;

            console.log('[PATREON] ✅ Tokens renovados com sucesso');
            console.log('[PATREON] ⚠️ IMPORTANTE: Atualize o .env com os novos tokens:');
            console.log(`PATREON_CREATOR_ACCESS_TOKEN=${this.accessToken}`);
            console.log(`PATREON_CREATOR_REFRESH_TOKEN=${this.refreshToken}`);

            return {
                accessToken: this.accessToken,
                refreshToken: this.refreshToken
            };

        } catch (error) {
            console.error('[PATREON] ❌ Erro ao renovar tokens:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Buscar informações da campanha
     */
    async getCampaign() {
        try {
            const data = await this.makeRequest('/campaigns', {
                'fields[campaign]': 'creation_name,patron_count,is_monthly'
            });

            if (data.data && data.data.length > 0) {
                const campaign = data.data[0];
                this.campaignId = campaign.id;
                
                console.log('[PATREON] ✅ Campanha encontrada:', campaign.attributes.creation_name);
                console.log('[PATREON] 📊 Patronos:', campaign.attributes.patron_count);
                console.log('[PATREON] 💰 Tipo:', campaign.attributes.is_monthly ? 'Mensal' : 'Por criação');
                
                return campaign;
            }

            throw new Error('Nenhuma campanha encontrada');

        } catch (error) {
            console.error('[PATREON] ❌ Erro ao buscar campanha:', error.message);
            throw error;
        }
    }

    /**
     * Buscar todos os patronos ativos
     */
    async getPatrons() {
        try {
            if (!this.campaignId) {
                await this.getCampaign();
            }

            const data = await this.makeRequest(`/campaigns/${this.campaignId}/members`, {
                'include': 'currently_entitled_tiers,user',
                'fields[member]': 'full_name,patron_status,currently_entitled_amount_cents,lifetime_support_cents,email',
                'fields[tier]': 'title,amount_cents',
                'fields[user]': 'full_name,email,social_connections'
            });

            const patrons = [];

            if (data.data) {
                for (const member of data.data) {
                    // Apenas patronos ativos
                    if (member.attributes.patron_status !== 'active_patron') continue;

                    const patron = {
                        id: member.id,
                        fullName: member.attributes.full_name,
                        email: member.attributes.email,
                        status: member.attributes.patron_status,
                        currentlyEntitledAmountCents: member.attributes.currently_entitled_amount_cents,
                        lifetimeSupportCents: member.attributes.lifetime_support_cents,
                        tiers: []
                    };

                    // Buscar informações dos tiers
                    if (member.relationships?.currently_entitled_tiers?.data) {
                        for (const tierRef of member.relationships.currently_entitled_tiers.data) {
                            const tier = data.included?.find(inc => inc.id === tierRef.id && inc.type === 'tier');
                            if (tier) {
                                patron.tiers.push({
                                    id: tier.id,
                                    title: tier.attributes.title,
                                    amountCents: tier.attributes.amount_cents
                                });
                            }
                        }
                    }

                    // Buscar informações do usuário
                    if (member.relationships?.user?.data) {
                        const user = data.included?.find(inc => inc.id === member.relationships.user.data.id && inc.type === 'user');
                        if (user) {
                            patron.userFullName = user.attributes.full_name;
                            patron.userEmail = user.attributes.email;
                            patron.socialConnections = user.attributes.social_connections;
                        }
                    }

                    patrons.push(patron);
                }
            }

            console.log(`[PATREON] ✅ ${patrons.length} patronos ativos encontrados`);
            return patrons;

        } catch (error) {
            console.error('[PATREON] ❌ Erro ao buscar patronos:', error.message);
            throw error;
        }
    }

    /**
     * Determinar tier do Discord baseado no valor da contribuição
     */
    getTierByAmount(amountCents) {
        // Valores em centavos (USD)
        if (amountCents >= 10000) return 'supernova';  // $100+
        if (amountCents >= 5000) return 'antares';     // $50+
        if (amountCents >= 2000) return 'sirius';      // $20+
        if (amountCents >= 500) return 'vega';         // $5+
        
        return null;
    }

    /**
     * Mapear tier do Patreon para role do Discord
     */
    getDiscordRole(tier) {
        return this.tierMapping[tier] || null;
    }

    /**
     * Sincronizar patronos com roles do Discord
     */
    async syncWithDiscord(discordService) {
        try {
            console.log('[PATREON] 🔄 Iniciando sincronização com Discord...');

            const patrons = await this.getPatrons();
            const syncResults = {
                success: 0,
                failed: 0,
                notLinked: 0,
                errors: []
            };

            for (const patron of patrons) {
                try {
                    // Determinar tier baseado no valor
                    const tier = this.getTierByAmount(patron.currentlyEntitledAmountCents);
                    if (!tier) {
                        console.log(`[PATREON] ⚠️ ${patron.fullName}: Valor muito baixo para tier`);
                        continue;
                    }

                    const discordRole = this.getDiscordRole(tier);
                    
                    // Aqui você precisaria ter um sistema de link entre email do Patreon e Discord ID
                    // Por enquanto, vamos apenas logar
                    console.log(`[PATREON] 📋 ${patron.fullName} (${patron.email}): ${discordRole}`);
                    
                    // TODO: Implementar lógica de atribuição de role no Discord
                    // Isso requer um sistema de link entre contas Patreon e Discord
                    
                    syncResults.success++;

                } catch (error) {
                    console.error(`[PATREON] ❌ Erro ao processar ${patron.fullName}:`, error.message);
                    syncResults.failed++;
                    syncResults.errors.push({
                        patron: patron.fullName,
                        error: error.message
                    });
                }
            }

            console.log('[PATREON] ✅ Sincronização concluída:');
            console.log(`  • Sucesso: ${syncResults.success}`);
            console.log(`  • Falhas: ${syncResults.failed}`);
            console.log(`  • Não vinculados: ${syncResults.notLinked}`);

            return syncResults;

        } catch (error) {
            console.error('[PATREON] ❌ Erro na sincronização:', error.message);
            throw error;
        }
    }

    /**
     * Verificar se um email é patrono ativo
     */
    async isActivePatron(email) {
        try {
            const patrons = await this.getPatrons();
            const patron = patrons.find(p => 
                p.email?.toLowerCase() === email.toLowerCase() ||
                p.userEmail?.toLowerCase() === email.toLowerCase()
            );

            if (patron) {
                const tier = this.getTierByAmount(patron.currentlyEntitledAmountCents);
                return {
                    isPatron: true,
                    tier: tier,
                    discordRole: this.getDiscordRole(tier),
                    amountCents: patron.currentlyEntitledAmountCents,
                    lifetimeSupportCents: patron.lifetimeSupportCents
                };
            }

            return { isPatron: false };

        } catch (error) {
            console.error('[PATREON] ❌ Erro ao verificar patrono:', error.message);
            return { isPatron: false, error: error.message };
        }
    }
}

export const patreonService = new PatreonService();
