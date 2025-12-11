'use client';

import Navbar from '@/components/Navbar';
import { useLanguage, useCredits } from '@/components/Providers';
import { ShoppingCart, Check, CreditCard, Sparkles, Zap, Building, Crown } from 'lucide-react';
import { simulateBuyCredits } from '@/app/actions';
import { useState } from 'react';
import { clsx } from 'clsx';
// Helper icon import fix if ShieldCheck wasn't imported
import { ShieldCheck } from 'lucide-react';
import SuccessModal from '@/components/SuccessModal';

export default function CreditsPage() {
    const { t } = useLanguage();
    const { refreshCredits } = useCredits();
    const [loadingPlan, setLoadingPlan] = useState<number | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastPurchase, setLastPurchase] = useState<number>(0);

    const plans = [
        // ... (unchanged plans array, will be kept by context matching if possible, but replace tool needs exact match. 
        // Since I'm replacing the whole file header to add import, and the handleBuy function, 
        // I might need to target specific chunks or verify I have the plan content correct.
        // Actually, viewing the file shows lines 1-199. I have the content.)
        {
            credits: 10,
            price: 15,
            name: "Starter",
            icon: Sparkles,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-slate-200",
            features: ["Acceso a protección N0-N4", "Verificaciones básicas", "Soporte estándar"]
        },
        {
            credits: 50,
            price: 60,
            name: "Pro",
            icon: Zap,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            border: "border-purple-200",
            recommended: true,
            features: ["Todo lo de Starter", "Cola prioritaria", "Descuentos por volumen", "Panel avanzado"]
        },
        {
            credits: 100,
            price: 100,
            name: "Business",
            icon: Building,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            border: "border-slate-200",
            features: ["Todo lo de Pro", "API Access (Beta)", "Soporte dedicado 24/7", "Auditoría completa"]
        },
        {
            credits: 500,
            price: 400,
            name: "Enterprise",
            icon: Crown,
            color: "text-yellow-600",
            bg: "bg-yellow-500/10",
            border: "border-yellow-200",
            features: ["Volumen ilimitado", "Infraestructura dedicada", "SLA Garantizado", "Training personalizado"]
        }
    ];

    const handleBuy = async (amount: number, price: number) => {
        setLoadingPlan(amount);
        try {
            // Simulate API delay
            await new Promise(r => setTimeout(r, 1000));

            const result = await simulateBuyCredits(amount, price);
            if (result.success) {
                await refreshCredits();
                setLastPurchase(amount);
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

    return (
        <>
            <Navbar />

            <SuccessModal
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                title="¡Compra Exitosa!"
                message={`Has añadido correctamente ${lastPurchase} créditos a tu cuenta. Ya están disponibles para usar.`}
            />

            <div className="w-full max-w-6xl px-4 mt-12 mb-20 text-slate-900 mx-auto">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <span className="text-blue-600 font-bold tracking-wide uppercase text-sm bg-blue-50 px-3 py-1 rounded-full border border-blue-100 mb-4 inline-block">
                        Planes y Precios
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 leading-tight">
                        Invierte en la <span className="text-gradient">Integridad</span> de tus Archivos
                    </h1>
                    <p className="text-lg text-slate-500 leading-relaxed">
                        Elige el paquete de créditos que mejor se adapte a tus necesidades.
                        Todos los planes incluyen acceso completo a la tecnología de certificación C2PA.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.credits}
                            className={clsx(
                                "relative flex flex-col p-6 rounded-2xl bg-white transition-all duration-300",
                                plan.recommended
                                    ? "shadow-xl border-2 scale-105 z-10 " + plan.border
                                    : "shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-1"
                            )}
                        >
                            {plan.recommended && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                                    Recomendado
                                </div>
                            )}

                            <div className="mb-6">
                                <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center mb-4", plan.bg, plan.color)}>
                                    <plan.icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
                                    <span className="text-slate-500 font-medium">/ pack</span>
                                </div>
                                <p className="text-sm text-slate-500 mt-2 font-medium">
                                    {plan.credits} créditos
                                    <span className="block text-xs font-normal opacity-70">
                                        (${(plan.price / plan.credits).toFixed(2)} / crédito)
                                    </span>
                                </p>
                            </div>

                            <div className="flex-1 space-y-3 mb-8">
                                {plan.features.map((feat, i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                        <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                                        <span>{feat}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handleBuy(plan.credits, plan.price)}
                                disabled={loadingPlan !== null}
                                className={clsx(
                                    "w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-sm",
                                    plan.recommended
                                        ? "bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl"
                                        : "bg-slate-100 text-slate-900 hover:bg-slate-200 hover:shadow"
                                )}
                            >
                                {loadingPlan === plan.credits ? (
                                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></span>
                                ) : (
                                    <>
                                        Comprar ahora
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* FAQ / Trust Section */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center border-t border-slate-200 pt-16">
                    <div>
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck size={24} />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Pago Seguro</h4>
                        <p className="text-sm text-slate-500">
                            Simulación de pasarela de pago segura y encriptada con estándares bancarios.
                        </p>
                    </div>
                    <div>
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Zap size={24} />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Activación Instantánea</h4>
                        <p className="text-sm text-slate-500">
                            Los créditos se añaden a tu cuenta automáticamente tras confirmar la compra.
                        </p>
                    </div>
                    <div>
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CreditCard size={24} />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Sin Caducidad</h4>
                        <p className="text-sm text-slate-500">
                            Tus créditos no caducan. Úsalos cuando los necesites, sin prisas.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
