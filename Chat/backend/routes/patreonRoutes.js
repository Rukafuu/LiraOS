import express from 'express';
import { patreonService } from '../services/patreonService.js';

const router = express.Router();

/**
 * GET /api/patreon/campaign
 * Buscar informações da campanha
 */
router.get('/campaign', async (req, res) => {
    try {
        const campaign = await patreonService.getCampaign();
        res.json({
            success: true,
            campaign: {
                id: campaign.id,
                name: campaign.attributes.creation_name,
                patronCount: campaign.attributes.patron_count,
                isMonthly: campaign.attributes.is_monthly
            }
        });
    } catch (error) {
        console.error('[PATREON API] Erro ao buscar campanha:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/patreon/patrons
 * Listar todos os patronos ativos
 */
router.get('/patrons', async (req, res) => {
    try {
        const patrons = await patreonService.getPatrons();
        
        // Formatar resposta
        const formattedPatrons = patrons.map(p => ({
            id: p.id,
            name: p.fullName || p.userFullName,
            email: p.email || p.userEmail,
            status: p.status,
            currentAmount: (p.currentlyEntitledAmountCents / 100).toFixed(2),
            lifetimeSupport: (p.lifetimeSupportCents / 100).toFixed(2),
            tier: patreonService.getTierByAmount(p.currentlyEntitledAmountCents),
            discordRole: patreonService.getDiscordRole(
                patreonService.getTierByAmount(p.currentlyEntitledAmountCents)
            ),
            tiers: p.tiers
        }));

        res.json({
            success: true,
            count: formattedPatrons.length,
            patrons: formattedPatrons
        });
    } catch (error) {
        console.error('[PATREON API] Erro ao buscar patronos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/patreon/check-patron
 * Verificar se um email é patrono ativo
 */
router.post('/check-patron', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email é obrigatório'
            });
        }

        const result = await patreonService.isActivePatron(email);
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('[PATREON API] Erro ao verificar patrono:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/patreon/refresh-tokens
 * Renovar access token
 */
router.post('/refresh-tokens', async (req, res) => {
    try {
        const tokens = await patreonService.refreshAccessToken();
        res.json({
            success: true,
            message: 'Tokens renovados com sucesso',
            tokens: {
                accessToken: tokens.accessToken.substring(0, 10) + '...',
                refreshToken: tokens.refreshToken.substring(0, 10) + '...'
            },
            warning: 'Atualize o .env com os novos tokens (veja o console)'
        });
    } catch (error) {
        console.error('[PATREON API] Erro ao renovar tokens:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/patreon/sync-discord
 * Sincronizar patronos com roles do Discord
 */
router.post('/sync-discord', async (req, res) => {
    try {
        // TODO: Passar discordService quando implementar
        const results = await patreonService.syncWithDiscord(null);
        
        res.json({
            success: true,
            message: 'Sincronização concluída',
            results
        });
    } catch (error) {
        console.error('[PATREON API] Erro na sincronização:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/patreon/tiers
 * Listar mapeamento de tiers
 */
router.get('/tiers', (req, res) => {
    res.json({
        success: true,
        tiers: {
            vega: {
                name: 'Vega Nebula',
                minAmount: 5.00,
                discordRole: '🌌 Vega Nebula'
            },
            sirius: {
                name: 'Sirius Blue',
                minAmount: 20.00,
                discordRole: '🌠 Sirius Blue'
            },
            antares: {
                name: 'Antares Red',
                minAmount: 50.00,
                discordRole: '🔴 Antares Red'
            },
            supernova: {
                name: 'Supernova',
                minAmount: 100.00,
                discordRole: '🏆 Supernova'
            }
        }
    });
});

export default router;
