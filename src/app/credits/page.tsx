'use client';

import Navbar from '@/components/Navbar';
import { useCredits } from '@/components/Providers';
import { simulateBuyCredits } from '@/app/actions';
import { useState } from 'react';
import { clsx } from 'clsx';
import { Check, Shield, Zap, Scale, Building2, Fingerprint, FileSignature, HelpCircle, Plus } from 'lucide-react';
import SuccessModal from '@/components/SuccessModal';

export default function PricingPage() {
    const { refreshCredits } = useCredits();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastPurchase, setLastPurchase] = useState<{ amount: number, name: string }>({ amount: 0, name: '' });

    // Custom Calculator State
    const [extraCredits, setExtraCredits] = useState(50);

    const plans = [
        {
            id: 'starter',
            name: "Starter",
            price: 49,
            credits: 300,
            description: "Para profesionales independientes y pequeños despachos.",
            features: [
                "20 protecciones / mes aprox.",
                "100 verificaciones",
                "Watermark Visible + Invisible",
                "Manifiesto C2PA Básico",
                "Soporte por email"
            ],
            cta: "Empezar Ahora",
            color: "blue",
            icon: FileSignature
        },
        {
            id: 'pro',
            name: "Professional",
            price: 149,
            credits: 2000,
            recommended: true,
            description: "Infraestructura de confianza para auditores y notarios.",
            features: [
                "100 protecciones / mes aprox.",
                "1,000 verificaciones",
                "Firma Digital Avanzada",
                "Historial Auditable Completo",
                "API Access (Beta)",
                "Badge de Verificación Verificado"
            ],
            cta: "Obtener Professional",
            color: "indigo",
            icon: Scale
        },
        {
            id: 'enterprise',
            name: "Enterprise",
            price: "Custom",
            credits: null,
            description: "Soluciones a medida para corporaciones y legal tech.",
            features: [
                "Custodia de claves dedicada",
                "Evidencia WORM (Write Once Read Many)",
                "Exportación Pericial Forense",
                "SLA + Soporte Prioritario",
                "Despliegue On-Premise opcional"
            ],
            cta: "Contactar Ventas",
            color: "slate",
            icon: Building2,
            isContact: true
        }
    ];

    const handleBuy = async (plan: typeof plans[0]) => {
        if (plan.isContact) {
            window.location.href = "mailto:sales@n0n4.com";
            return;
        }

        setLoadingPlan(plan.id);
        try {
            // Simulate API delay
            await new Promise(r => setTimeout(r, 800));

            // Logic: 
            // Starter ($49) -> 300 credits
            // Pro ($149) -> 2000 credits
            const result = await simulateBuyCredits(plan.credits!, typeof plan.price === 'number' ? plan.price : 0, plan.name);

            if (result.success) {
                await refreshCredits();
                setLastPurchase({ amount: plan.credits!, name: plan.name });
                setShowSuccess(true);
            } else {
                alert("Error en la transacción.");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        } finally {
            setLoadingPlan(null);
        }
    };

    const handleBuyCustom = async () => {
        setLoadingPlan('custom');
        // Simple pricing for extra credits: ~$0.50 per credit for small amounts?
        // User said: "Protection extra: 2–3 USD" (10 credits) => $0.20-$0.30 per credit
        // "Verification extra: 0.25–0.50 USD" (1 credit) => $0.25-$0.50 per credit
        // Let's average to $0.30 per credit for ad-hoc?
        const price = Math.round(extraCredits * 0.30);

        try {
            await new Promise(r => setTimeout(r, 800));
            const result = await simulateBuyCredits(extraCredits, price, `Pack ${extraCredits} Créditos`);
            if (result.success) {
                await refreshCredits();
                setLastPurchase({ amount: extraCredits, name: "Créditos Adicionales" });
                setShowSuccess(true);
            }
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <>
            <Navbar />

            <SuccessModal
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                title="¡Plan Activado!"
                message={`Has adquirido el plan ${lastPurchase.name}. Se han añadido ${lastPurchase.amount} créditos a tu cuenta.`}
            />

            <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950/50">
                {/* Hero */}
                <div className="pt-32 pb-20 px-4 text-center max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-6">
                        <Shield size={14} className="fill-current" />
                        <span>Infraestructura de Confianza</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
                        No vendemos software,<br />
                        <span className="text-gradient">vendemos certeza legal.</span>
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        N0N4 no es solo una herramienta técnica. Es la capa de verificación para despachos, auditores y peritos que necesitan evidencia inmutable.
                    </p>
                </div>

                {/* Plans Grid */}
                <div className="max-w-7xl mx-auto px-4 pb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={clsx(
                                    "relative bg-white dark:bg-slate-900 rounded-2xl p-8 transition-all duration-300",
                                    plan.recommended
                                        ? "shadow-2xl shadow-indigo-500/10 border-2 border-indigo-600 scale-105 z-10"
                                        : "shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 hover:-translate-y-1"
                                )}
                            >
                                {plan.recommended && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                                        Recomendado
                                    </div>
                                )}

                                <div className="flex items-center gap-4 mb-6">
                                    <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center",
                                        plan.id === 'pro' ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"
                                    )}>
                                        <plan.icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                                        {typeof plan.price === 'number' ? (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-bold text-slate-900 dark:text-white">${plan.price}</span>
                                                <span className="text-slate-500">/ mes</span>
                                            </div>
                                        ) : (
                                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{plan.price}</div>
                                        )}
                                    </div>
                                </div>

                                <p className="text-slate-500 dark:text-slate-400 mb-8 min-h-[48px]">
                                    {plan.description}
                                </p>

                                <div className="space-y-4 mb-8">
                                    {plan.features.map((feat, i) => (
                                        <div key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                                            <div className="mt-0.5 min-w-[16px]">
                                                <Check size={16} className="text-green-500" strokeWidth={3} />
                                            </div>
                                            {feat}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleBuy(plan)}
                                    disabled={loadingPlan !== null}
                                    className={clsx(
                                        "w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                                        plan.id === 'pro'
                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                                            : "bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                                    )}
                                >
                                    {loadingPlan === plan.id ? (
                                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></span>
                                    ) : (
                                        plan.cta
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Additional Credits Section */}
                    <div className="max-w-3xl mx-auto mt-20 pt-16 border-t border-slate-200 dark:border-slate-800">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                ¿Necesitas más capacidad?
                            </h2>
                            <p className="text-slate-500">
                                Añade créditos adicionales a tu plan en cualquier momento.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Cantidad de Créditos
                                </label>
                                <input
                                    type="range"
                                    min="10"
                                    max="500"
                                    step="10"
                                    value={extraCredits}
                                    onChange={(e) => setExtraCredits(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between mt-2 text-xs text-slate-400 font-mono">
                                    <span>10</span>
                                    <span>500</span>
                                </div>
                            </div>

                            <div className="text-center md:text-right min-w-[150px]">
                                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                                    {extraCredits} <span className="text-lg font-normal text-slate-500">créditos</span>
                                </div>
                                <div className="text-sm text-slate-500 mb-4">
                                    ~${(extraCredits * 0.30).toFixed(2)} USD
                                </div>
                                <button
                                    onClick={handleBuyCustom}
                                    disabled={loadingPlan !== null}
                                    className="w-full px-6 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {loadingPlan === 'custom' ? (
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                                    ) : (
                                        <>
                                            <Plus size={16} /> Añadir
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4 text-center text-xs text-slate-400">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                <span className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Protección Extra</span>
                                ~2 USD / archivo (10 créditos)
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                <span className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Verificación Extra</span>
                                ~0.25 USD / verificación (1 crédito)
                            </div>
                        </div>
                    </div>

                    {/* Trust Footnote */}
                    <div className="mt-20 text-center">
                        <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
                            <Fingerprint size={16} />
                            <span>Tus claves criptográficas son custodiadas en Hardware Security Modules (HSM) dedicados.</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
