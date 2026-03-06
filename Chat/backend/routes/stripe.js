import express from 'express';
import Stripe from 'stripe';
import { getUserById, updateUser } from '../user_store.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Lazy Stripe init — env vars may not be loaded at import time
let stripe = null;
function getStripe() {
    if (stripe) return stripe;
    const key = (process.env.STRIPE_SECRET_KEY || process.env.STRIPE_KEY)?.trim();
    if (key) {
        stripe = new Stripe(key);
        console.log('[STRIPE] ✅ Payment system initialized (lazy)');
    } else {
        console.warn('[STRIPE] ⚠️ No STRIPE_SECRET_KEY found in env');
    }
    return stripe;
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://liraos-production.up.railway.app';

// ─────────────────────────────────────────
// TIER DEFINITIONS
// ─────────────────────────────────────────
const TIERS = {
    vega: {
        name: 'Vega Nebula',
        priceUSD: 500,     // $5.00 in cents
        priceBRL: 2490,    // R$24.90 in cents
        features: [
            'Discord Bot access',
            'Vega Nebula Discord role',
            'Exclusive Vega lounge channel',
            'Custom voice (ElevenLabs)',
            'Priority image generation',
            'WhatsApp Premium bot'
        ]
    },
    sirius: {
        name: 'Sirius Blue',
        priceUSD: 2000,    // $20.00
        priceBRL: 9990,    // R$99.90
        features: [
            'Everything in Vega +',
            'Sirius Blue Discord role',
            'Exclusive Sirius lounge channel',
            'Higher rate limits',
            'Priority support'
        ]
    },
    antares: {
        name: 'Antares Red',
        priceUSD: 5000,    // $50.00
        priceBRL: 24990,   // R$249.90
        features: [
            'Everything in Sirius +',
            'Antares Red Discord role',
            'Exclusive Antares lounge channel',
            'L.A.P Agent mode (extended)',
            'Early access to new features'
        ]
    },
    supernova: {
        name: 'Supernova',
        priceUSD: 10000,   // $100.00
        priceBRL: 49990,   // R$499.90
        features: [
            'Everything in Antares +',
            'Supernova Discord role',
            'Access to ALL channels',
            'Direct developer support',
            'Custom Lira persona',
            'Lifetime supporter badge'
        ]
    }
};

// ─────────────────────────────────────────
// GET /api/stripe/tiers
// Public: List available tiers and prices
// ─────────────────────────────────────────
router.get('/tiers', (req, res) => {
    const tiers = Object.entries(TIERS).map(([id, tier]) => ({
        id,
        name: tier.name,
        priceUSD: tier.priceUSD,
        priceBRL: tier.priceBRL,
        priceFormatUSD: `$${(tier.priceUSD / 100).toFixed(2)}/mo`,
        priceFormatBRL: `R$${(tier.priceBRL / 100).toFixed(2)}/mo`,
        features: tier.features
    }));

    res.json({ success: true, tiers });
});

// ─────────────────────────────────────────
// POST /api/stripe/create-checkout
// Auth: Create a Stripe Checkout session
// ─────────────────────────────────────────
router.post('/create-checkout', requireAuth, async (req, res) => {
    const s = getStripe();
    if (!s) return res.status(503).json({ error: 'Payment system not configured' });

    const userId = req.userId;
    const { tier, currency = 'usd' } = req.body;

    if (!tier || !TIERS[tier]) {
        return res.status(400).json({ error: 'Invalid tier', validTiers: Object.keys(TIERS) });
    }

    const tierData = TIERS[tier];
    const user = await getUserById(userId);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already has this plan
    if (user.plan === tier) {
        return res.status(400).json({ error: 'You are already on this plan' });
    }

    try {
        // Create or get Stripe customer
        let customerId = user.stripeCustomerId;
        
        if (!customerId) {
            const customer = await s.customers.create({
                email: user.email,
                metadata: {
                    liraos_user_id: userId,
                    username: user.username
                }
            });
            customerId = customer.id;
            await updateUser(userId, { stripeCustomerId: customerId });
        }

        // Determine price based on currency
        const unitAmount = currency === 'brl' ? tierData.priceBRL : tierData.priceUSD;

        const session = await s.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: currency === 'brl' 
                ? ['card', 'boleto'] 
                : ['card'],
            line_items: [{
                price_data: {
                    currency: currency,
                    product_data: {
                        name: `LiraOS ${tierData.name}`,
                        description: tierData.features.join(' | '),
                        images: ['https://liraos-production.up.railway.app/lira_icon.png']
                    },
                    unit_amount: unitAmount,
                    recurring: {
                        interval: 'month'
                    }
                },
                quantity: 1
            }],
            metadata: {
                liraos_user_id: userId,
                tier: tier
            },
            success_url: `${FRONTEND_URL}?payment=success&tier=${tier}`,
            cancel_url: `${FRONTEND_URL}?payment=cancelled`,
            allow_promotion_codes: true
        });

        console.log(`[STRIPE] Checkout created for ${user.email} -> ${tier} (${currency.toUpperCase()})`);

        res.json({
            success: true,
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('[STRIPE] Checkout error:', error);
        res.status(500).json({ error: 'Failed to create checkout session', details: error.message });
    }
});

// ─────────────────────────────────────────
// POST /api/stripe/customer-portal
// Auth: Open Stripe Customer Portal (manage subscription)
// ─────────────────────────────────────────
router.post('/customer-portal', requireAuth, async (req, res) => {
    const s = getStripe();
    if (!s) return res.status(503).json({ error: 'Payment system not configured' });

    const userId = req.userId;
    const user = await getUserById(userId);

    if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ error: 'No active subscription found' });
    }

    try {
        const portalSession = await s.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: FRONTEND_URL
        });

        res.json({ success: true, url: portalSession.url });
    } catch (error) {
        console.error('[STRIPE] Portal error:', error);
        res.status(500).json({ error: 'Failed to create portal session' });
    }
});

// ─────────────────────────────────────────
// GET /api/stripe/status
// Auth: Check current subscription status
// ─────────────────────────────────────────
router.get('/status', requireAuth, async (req, res) => {
    const s = getStripe();
    if (!s) return res.status(503).json({ error: 'Payment system not configured' });

    const userId = req.userId;
    const user = await getUserById(userId);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const result = {
        plan: user.plan || 'free',
        stripeCustomerId: user.stripeCustomerId || null,
        subscription: null
    };

    // If user has a Stripe customer, check active subscriptions
    if (user.stripeCustomerId) {
        try {
            const subscriptions = await s.subscriptions.list({
                customer: user.stripeCustomerId,
                status: 'active',
                limit: 1
            });

            if (subscriptions.data.length > 0) {
                const sub = subscriptions.data[0];
                result.subscription = {
                    id: sub.id,
                    status: sub.status,
                    currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
                    cancelAtPeriodEnd: sub.cancel_at_period_end
                };
            }
        } catch (e) {
            console.error('[STRIPE] Status check error:', e);
        }
    }

    res.json({ success: true, ...result });
});

// ─────────────────────────────────────────
// POST /api/stripe/webhook
// Stripe webhook (no auth, verified by signature)
// ─────────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const s = getStripe();
    if (!s) return res.status(503).send('Not configured');

    let event;

    // Verify webhook signature
    const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
    if (STRIPE_WEBHOOK_SECRET) {
        try {
            const sig = req.headers['stripe-signature'];
            event = s.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            console.error('[STRIPE] Webhook signature failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
    } else {
        // Dev mode: trust the event without signature verification
        event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }

    console.log(`[STRIPE] Webhook: ${event.type}`);

    try {
        switch (event.type) {
            // Checkout completed -> Upgrade user
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata?.liraos_user_id;
                const tier = session.metadata?.tier;

                if (userId && tier && TIERS[tier]) {
                    await updateUser(userId, { plan: tier });
                    console.log(`[STRIPE] User ${userId} upgraded to ${tier}`);
                }
                break;
            }

            // Subscription updated (upgrade/downgrade)
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const customerId = subscription.customer;

                // Find user by stripeCustomerId
                const customer = await s.customers.retrieve(customerId);
                const userId = customer.metadata?.liraos_user_id;

                if (userId) {
                    if (subscription.status === 'active') {
                        // Keep current plan
                        console.log(`[STRIPE] Subscription active for ${userId}`);
                    } else if (subscription.status === 'past_due') {
                        console.log(`[STRIPE] Subscription past_due for ${userId}`);
                    }
                }
                break;
            }

            // Subscription cancelled -> Downgrade to free
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const customerId = subscription.customer;

                const customer = await s.customers.retrieve(customerId);
                const userId = customer.metadata?.liraos_user_id;

                if (userId) {
                    await updateUser(userId, { plan: 'free' });
                    console.log(`[STRIPE] User ${userId} downgraded to FREE (subscription cancelled)`);
                }
                break;
            }

            // Invoice payment failed
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                console.log(`[STRIPE] Payment failed for customer ${invoice.customer}`);
                break;
            }

            default:
                console.log(`[STRIPE] Unhandled event: ${event.type}`);
        }
    } catch (error) {
        console.error('[STRIPE] Webhook processing error:', error);
    }

    res.json({ received: true });
});

export default router;
