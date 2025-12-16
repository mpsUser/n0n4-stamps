'use client';

import Navbar from '@/components/Navbar';
import { useLanguage, useCredits } from '@/components/Providers';
import { CreditCard, FileUp, FolderOpen, TrendingUp, ShieldCheck, Activity, Leaf, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { logActivity, getUserUploads, getLogs, clearActivityLogs, getUserProfile } from '@/app/actions';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { DollarSign, Key, Lock, Crown } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function DashboardPage() {
    const { t } = useLanguage();
    const { user } = useUser();
    const [showClearModal, setShowClearModal] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    // Log access on mount
    useEffect(() => {
        if (user) {
            logActivity('DASHBOARD_ACCESS', 'User viewed dashboard', user.primaryEmailAddress?.emailAddress || 'Unknown');
        }
    }, [user]);

    const { credits } = useCredits();

    const [stats, setStats] = useState({
        protected: 0,
        saved: '0 MB',
        verifications: 0,
        score: 95,
        carbon: '0 g',
        plan: 'Free'
    });

    async function loadServerData() {
        if (!user) return;
        const [uploads, logs, profile] = await Promise.all([
            getUserUploads(),
            getLogs(),
            getUserProfile()
        ]);

        const protectedCount = uploads.length;
        const verifications = logs.filter(l => l.action.includes('VERIFY')).length;

        const sizeMB = protectedCount * 3.2; // Mock avg size
        const carbon = (protectedCount * 0.5).toFixed(1) + 'g';

        let planDisplay = 'Free';
        if (profile?.plan) {
            planDisplay = profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1);
        }

        setStats({
            protected: protectedCount,
            saved: sizeMB.toFixed(0) + ' MB',
            verifications,
            score: 95 + Math.min(protectedCount, 5), // dynamic score
            carbon,
            plan: planDisplay
        });
    }

    useEffect(() => {
        loadServerData();
    }, [user]);

    const handleClearLogs = async () => {
        setIsClearing(true);
        await clearActivityLogs();
        await loadServerData(); // Refresh stats (should go to 0 verifications etc)
        setIsClearing(false);
        setShowClearModal(false);
    };

    return (
        <>
            <Navbar />

            <div className="w-full max-w-6xl px-4 mt-8 mb-20 text-slate-900">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 capitalize">{t('dash.title')}</h1>
                        <div className="flex items-center gap-3">
                            <p className="text-slate-500">Bienvenido, {user?.firstName || 'Usuario'}</p>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                                {stats.plan === 'Professional' || stats.plan === 'Enterprise' ? <Crown size={12} className="text-yellow-500" /> : null}
                                Plan {stats.plan}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Original 3 */}
                    <div className="glass-panel p-6 flex flex-col justify-between h-40 bg-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-sm font-medium uppercase">{t('dash.credits')}</p>
                                <h2 className="text-4xl font-bold text-slate-900 mt-2">{credits}</h2>
                            </div>
                            <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
                                <CreditCard size={24} />
                            </div>
                        </div>
                        <div className="text-sm text-green-500 flex items-center gap-1">
                            <TrendingUp size={14} /> +20 this week
                        </div>
                    </div>

                    <div className="glass-panel p-6 flex flex-col justify-between h-40 bg-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-sm font-medium uppercase">{t('dash.protected')}</p>
                                <h2 className="text-4xl font-bold text-slate-900 mt-2">{stats.protected}</h2>
                            </div>
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                                <FileUp size={24} />
                            </div>
                        </div>
                        <div className="text-sm text-slate-500">Total files managed</div>
                    </div>

                    <div className="glass-panel p-6 flex flex-col justify-between h-40 bg-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-sm font-medium uppercase">{t('dash.saved')}</p>
                                <h2 className="text-4xl font-bold text-slate-900 mt-2">{stats.saved}</h2>
                            </div>
                            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg">
                                <FolderOpen size={24} />
                            </div>
                        </div>
                        <div className="text-sm text-slate-500">Cloud storage used</div>
                    </div>

                    {/* New 3 */}
                    <div className="glass-panel p-6 flex flex-col justify-between h-40 bg-white border-t-4 border-t-orange-400">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-sm font-medium uppercase">Verificaciones</p>
                                <h2 className="text-4xl font-bold text-slate-900 mt-2">{stats.verifications}</h2>
                            </div>
                            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg">
                                <ShieldCheck size={24} />
                            </div>
                        </div>
                        <div className="text-sm text-slate-500">Validations performed</div>
                    </div>

                    <div className="glass-panel p-6 flex flex-col justify-between h-40 bg-white border-t-4 border-t-red-400">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-sm font-medium uppercase">Activity Score</p>
                                <h2 className="text-4xl font-bold text-slate-900 mt-2">{stats.score}</h2>
                            </div>
                            <div className="p-3 bg-red-500/10 text-red-500 rounded-lg">
                                <Activity size={24} />
                            </div>
                        </div>
                        <div className="text-sm text-green-500">High Engagement</div>
                    </div>

                    <div className="glass-panel p-6 flex flex-col justify-between h-40 bg-white border-t-4 border-t-teal-400">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-sm font-medium uppercase">Huella Carbono</p>
                                <h2 className="text-4xl font-bold text-slate-900 mt-2">{stats.carbon}</h2>
                            </div>
                            <div className="p-3 bg-teal-500/10 text-teal-500 rounded-lg">
                                <Leaf size={24} />
                            </div>
                        </div>
                        <div className="text-sm text-slate-500">Estimado por transacción</div>
                    </div>

                </div>

                {/* Quick Actions */}
                <h2 className="text-xl font-bold text-slate-900 mb-4">{t('dash.quick')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="/upload" className="glass-panel p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors group bg-white">
                        <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileUp size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">{t('dash.new')}</h3>
                            <p className="text-slate-500">JPG, PNG, PDF</p>
                        </div>
                    </Link>

                    <Link href="/library" className="glass-panel p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors group bg-white">
                        <div className="w-12 h-12 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FolderOpen size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">{t('dash.lib')}</h3>
                            <p className="text-slate-500">History</p>
                        </div>
                    </Link>

                    <button
                        onClick={() => setShowClearModal(true)}
                        className="glass-panel p-6 flex items-center gap-4 hover:bg-red-50 transition-colors group bg-white text-left w-full"
                    >
                        <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">{t('btn.clear_logs')}</h3>
                            <p className="text-slate-500">Reset stats</p>
                        </div>
                    </button>
                </div>

                {/* Professional Features Section */}
                <div className="mt-12">
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        {stats.plan === 'Professional' || stats.plan === 'Enterprise' ? (
                            <Key size={20} className="text-indigo-600" />
                        ) : (
                            <Lock size={20} className="text-slate-400" />
                        )}
                        Developer API & Advanced Features
                    </h2>

                    {stats.plan === 'Professional' || stats.plan === 'Enterprise' ? (
                        <div className="glass-panel p-6 bg-slate-900 text-white">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-lg text-white">API Keys</h3>
                                    <p className="text-slate-400 text-sm">Use these keys to authenticate API requests.</p>
                                </div>
                                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold">
                                    Generate New Key
                                </button>
                            </div>
                            <div className="bg-black/30 p-4 rounded-lg font-mono text-sm flex items-center justify-between border border-white/10">
                                <span className="text-slate-300">pk_live_51M...xYz</span>
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Active</span>
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Signature Level</span>
                                    <div className="font-bold text-green-400 flex items-center gap-2">
                                        <ShieldCheck size={16} /> Advanced Digital Sign
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Audit Log Retention</span>
                                    <div className="font-bold text-white">Unlimited</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel p-8 bg-slate-50 border-dashed border-2 border-slate-300 flex flex-col items-center justify-center text-center">
                            <Lock size={48} className="text-slate-300 mb-4" />
                            <h3 className="font-bold text-lg text-slate-700 mb-2">Feature Locked</h3>
                            <p className="text-slate-500 max-w-md mb-6">
                                Upgrade to the <span className="font-bold text-indigo-600">Professional Plan</span> to access API Keys, Advanced Digital Signatures, and Unlimited Audit Logs.
                            </p>
                            <Link href="/credits" className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors">
                                Upgrade Plan
                            </Link>
                        </div>
                    )}
                </div>

                <ConfirmationModal
                    isOpen={showClearModal}
                    onClose={() => setShowClearModal(false)}
                    onConfirm={handleClearLogs}
                    title={t('btn.clear_logs')}
                    message={t('msg.confirm_reset_stats')}
                    isDestructive={true}
                    isLoading={isClearing}
                />

            </div>
        </>
    );
}
