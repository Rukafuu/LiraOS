import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Crown, Zap, Star, Gem, ExternalLink, Loader2 } from 'lucide-react';
import { getAuthHeaders } from '../services/userService';
import LiraLogo from '../assets/liralogo.png';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
}

interface TierData {
  id: string;
  name: string;
  priceUSD: number;
  priceBRL: number;
  priceFormatUSD: string;
  priceFormatBRL: string;
  features: string[];
}

const TIER_STYLES: Record<string, { icon: React.ReactNode; gradient: string; glow: string; border: string }> = {
  vega: {
    icon: <Star size={24} />,
    gradient: 'from-indigo-600 to-purple-600',
    glow: 'shadow-indigo-500/30',
    border: 'border-indigo-500/40'
  },
  sirius: {
    icon: <Zap size={24} />,
    gradient: 'from-blue-500 to-cyan-400',
    glow: 'shadow-blue-500/30',
    border: 'border-blue-500/40'
  },
  antares: {
    icon: <Gem size={24} />,
    gradient: 'from-red-500 to-orange-500',
    glow: 'shadow-red-500/30',
    border: 'border-red-500/40'
  },
  supernova: {
    icon: <Crown size={24} />,
    gradient: 'from-yellow-400 to-amber-500',
    glow: 'shadow-yellow-500/40',
    border: 'border-yellow-500/50'
  }
};

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, currentPlan = 'free' }) => {
  const { t } = useTranslation();
  const [tiers, setTiers] = useState<TierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'usd' | 'brl'>('brl');

  useEffect(() => {
    if (isOpen) {
      fetchTiers();
    }
  }, [isOpen]);

  const fetchTiers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stripe/tiers`);
      const data = await res.json();
      if (data.success) {
        setTiers(data.tiers);
      }
    } catch (err) {
      console.error('Failed to fetch tiers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (tierId: string) => {
    setCheckingOut(tierId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/stripe/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ tier: tierId, currency })
      });

      const data = await res.json();

      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        alert(data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setCheckingOut(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stripe/customer-portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });

      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Portal error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#0a0a12] border border-white/10 rounded-3xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#0a0a12]/95 backdrop-blur-lg border-b border-white/5 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <img src={LiraLogo} alt="Lira" className="w-7 h-7 object-contain" />
                {t('pricing.title')}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {t('pricing.subtitle')}
                {currentPlan !== 'free' && (
                  <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-xs uppercase">
                    {t('pricing.current')}: {currentPlan}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Currency Toggle */}
              <div className="flex bg-white/5 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setCurrency('brl')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    currency === 'brl' ? 'bg-green-500/20 text-green-300' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {t('pricing.currency_brl')}
                </button>
                <button
                  onClick={() => setCurrency('usd')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    currency === 'usd' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {t('pricing.currency_usd')}
                </button>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-purple-400" size={32} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tiers.map((tier, index) => {
                  const style = TIER_STYLES[tier.id] || TIER_STYLES.vega;
                  const isCurrentPlan = currentPlan === tier.id;
                  const isPopular = tier.id === 'sirius';
                  const price = currency === 'brl' ? tier.priceBRL : tier.priceUSD;
                  const priceFormatted = currency === 'brl'
                    ? `R$${(tier.priceBRL / 100).toFixed(2)}`
                    : `$${(tier.priceUSD / 100).toFixed(2)}`;

                  return (
                    <motion.div
                      key={tier.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative flex flex-col rounded-2xl border ${style.border} bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 overflow-hidden ${
                        isPopular ? `shadow-xl ${style.glow}` : ''
                      } ${isCurrentPlan ? 'ring-2 ring-purple-500' : ''}`}
                    >
                      {/* Popular Badge */}
                      {isPopular && (
                        <div className={`absolute top-0 left-0 right-0 py-1 text-center text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r ${style.gradient} text-white`}>
                          {t('pricing.most_popular')}
                        </div>
                      )}

                      <div className={`p-5 ${isPopular ? 'pt-8' : ''}`}>
                        {/* Tier Icon & Name */}
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${style.gradient} bg-opacity-20 mb-4`}>
                          <span className="text-white">{style.icon}</span>
                          <span className="text-white font-bold text-sm">{tier.name}</span>
                        </div>

                        {/* Price */}
                        <div className="mb-5">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-white">{priceFormatted}</span>
                            <span className="text-gray-500 text-sm">{t('pricing.per_month')}</span>
                          </div>
                        </div>

                        {/* Features */}
                        <ul className="space-y-2.5 mb-6">
                          {tier.features.map((feature, fi) => (
                            <li key={fi} className="flex items-start gap-2 text-sm text-gray-300">
                              <Check className="text-green-400 shrink-0 mt-0.5" size={14} />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {/* CTA Button */}
                        {isCurrentPlan ? (
                          <button
                            onClick={handleManageSubscription}
                            className="w-full py-2.5 px-4 border border-purple-500/30 text-purple-300 rounded-xl text-sm font-medium hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2"
                          >
                            <ExternalLink size={14} />
                            {t('pricing.manage_plan')}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCheckout(tier.id)}
                            disabled={checkingOut !== null}
                            className={`w-full py-2.5 px-4 bg-gradient-to-r ${style.gradient} hover:opacity-90 disabled:opacity-50 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg ${style.glow}`}
                          >
                            {checkingOut === tier.id ? (
                              <>
                                <Loader2 className="animate-spin" size={16} />
                                {t('pricing.redirecting')}
                              </>
                            ) : (
                              <>
                                <Sparkles size={14} />
                                {t('pricing.subscribe')}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center space-y-2">
              <p className="text-xs text-gray-500">
                {t('pricing.secure_payment')}
              </p>
              {currentPlan !== 'free' && (
                <button
                  onClick={handleManageSubscription}
                  className="text-xs text-purple-400 hover:text-purple-300 underline transition-colors"
                >
                  {t('pricing.manage_subscription')}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
