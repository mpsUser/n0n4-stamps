'use client';

import Navbar from '@/components/Navbar';
import { useLanguage, useCredits } from '@/components/Providers';
import { CreditCard, FileUp, FolderOpen, TrendingUp, ShieldCheck, Activity, Leaf, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { logActivity, getUserUploads, getLogs, getFinancialStats } from '@/app/actions';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';

export default function DashboardPage() {
    const { t } = useLanguage();
    const { user } = useUser();

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
        revenue: 0
    });

    useEffect(() => {
        async function loadServerData() {
            const uploads = await getUserUploads();
            const logs = await getLogs();
            const financial = await getFinancialStats();

            const protectedCount = uploads.length;
            const verifications = logs.filter(l => l.action.includes('VERIFY')).length;

            const sizeMB = protectedCount * 3.2; // Mock avg size
            const carbon = (protectedCount * 0.5).toFixed(1) + 'g';

            setStats({
                protected: protectedCount,
                saved: sizeMB.toFixed(0) + ' MB',
                verifications,
                score: 95 + Math.min(protectedCount, 5), // dynamic score
                carbon,
                revenue: financial.revenue
            });
        }
        if (user) loadServerData();
    }, [user]);

    return (
        <>
            <Navbar />

            <div className="w-full max-w-6xl px-4 mt-8 mb-20 text-slate-900">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 capitalize">{t('dash.title')}</h1>
                        <p className="text-slate-500">Bienvenido, {user?.firstName || 'Usuario'}</p>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Revenue Card (New) */}
                    <div className="glass-panel p-6 flex flex-col justify-between h-40 bg-white border-t-4 border-t-emerald-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-sm font-medium uppercase">Total Revenue</p>
                                <h2 className="text-4xl font-bold text-slate-900 mt-2">${stats.revenue.toFixed(2)}</h2>
                            </div>
                            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
                                <DollarSign size={24} />
                            </div>
                        </div>
                        <div className="text-sm text-slate-500">Total investment</div>
                    </div>

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
                </div>

            </div>
        </>
    );
}
