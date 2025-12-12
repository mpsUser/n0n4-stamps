'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Settings, Save, User as UserIcon, CreditCard, Activity, List, RefreshCw, Lock, AlertTriangle, Users, TrendingUp, TrendingDown, Search, PenSquare, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { getLogs, ActivityLog, adminGetAllUsers, adminUpdateUser, getConfig, updateConfig, UserProfile, AppConfig, getFinancialStats, clearActivityLogs } from '@/app/actions';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';
import { useCredits, useLanguage } from '@/components/Providers';
import EditUserModal from '@/components/EditUserModal';
import ConfirmationModal from '@/components/ConfirmationModal';

const ADMIN_EMAIL = 'marcpedrero@gmail.com';

export default function AdminPage() {
    const { user, isLoaded } = useUser();
    const { refreshCredits } = useCredits();
    const { t } = useLanguage();

    const [activeTab, setActiveTab] = useState<'settings' | 'logs' | 'users'>('logs');

    // Settings State
    const [config, setConfig] = useState<AppConfig>({ protectionCost: 1, verificationCost: 1 });
    const [isSavingConfig, setIsSavingConfig] = useState(false);

    // Logs State
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    // Users State
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

    // Revenue State
    const [stats, setStats] = useState({ revenue: 0, momGrowth: 0, dailyTrend: [] as { date: string, value: number }[] });

    const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

    // Load Data based on Tab
    useEffect(() => {
        if (!isAdmin) return;

        if (activeTab === 'logs') loadLogs();
        if (activeTab === 'settings') loadConfig();
        if (activeTab === 'users') loadUsers();

        // Always load revenue for header or specific tab
        loadRevenue();

    }, [activeTab, isAdmin]);

    useEffect(() => {
        console.log('AdminPage Stats Updated:', stats);
    }, [stats]);

    const loadRevenue = async () => {
        const data = await getFinancialStats();
        // @ts-ignore - mismatch in dailyTrend typing if interface not exported strictly, but runtime is fine.
        setStats(data);
    };

    // Force tab logic
    useEffect(() => {
        if (isLoaded && !isAdmin && activeTab === 'settings') {
            setActiveTab('logs');
        }
    }, [isLoaded, isAdmin, activeTab]);


    // -- LOADERS --
    const loadLogs = async () => {
        setIsLoadingLogs(true);
        const data = await getLogs();
        setLogs(data);
        setIsLoadingLogs(false);
    }

    const loadConfig = async () => {
        const c = await getConfig();
        setConfig(c);
    }

    const loadUsers = async () => {
        setIsLoadingUsers(true);
        const u = await adminGetAllUsers();
        setAllUsers(u);
        setIsLoadingUsers(false);
    }


    // -- HANDLERS --

    const handleSaveConfig = async () => {
        setIsSavingConfig(true);
        await updateConfig(config);
        setIsSavingConfig(false);
        alert(t('admin.settings.save_success'));
    };

    const handleUpdateUser = async (email: string, changes: Partial<UserProfile>) => {
        await adminUpdateUser(email, changes);
        await loadUsers(); // reload list

        // If updating self, refresh client context
        if (email === user?.primaryEmailAddress?.emailAddress) {
            refreshCredits();
        }
    };

    const [showClearLogsModal, setShowClearLogsModal] = useState(false);
    const [isClearingLogs, setIsClearingLogs] = useState(false);

    const handleClearLogs = async () => {
        setIsClearingLogs(true);
        await clearActivityLogs();
        await loadLogs();
        setIsClearingLogs(false);
        setShowClearLogsModal(false);
    };

    if (!isLoaded) return <div className="p-10 text-center">Loading...</div>;

    return (
        <>
            <Navbar />
            <SignedOut>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="bg-red-50 p-8 rounded-2xl text-center border border-red-100">
                        <Lock size={48} className="text-red-400 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-red-900 mb-2">{t('admin.access_denied')}</h1>
                        <p className="text-red-700 mb-6">{t('admin.login_required')}</p>
                        <SignInButton mode="modal">
                            <button className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition">
                                {t('admin.btn.login')}
                            </button>
                        </SignInButton>
                    </div>
                </div>
            </SignedOut>
            <SignedIn>
                <div className="w-full max-w-5xl px-4 mt-12 mb-20 text-slate-900">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{t('nav.admin')}</h1>
                            <p className="text-slate-500">{t('admin.description')}</p>
                        </div>

                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {isAdmin && (
                                <button
                                    onClick={() => setActiveTab('settings')}
                                    className={clsx("px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2", activeTab === 'settings' ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700")}
                                >
                                    <Settings size={16} /> {t('admin.tab.settings')}
                                </button>
                            )}
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={clsx("px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2", activeTab === 'logs' ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700")}
                            >
                                <Activity size={16} /> {t('admin.tab.logs')}
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => setActiveTab('users')}
                                    className={clsx("px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2", activeTab === 'users' ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700")}
                                >
                                    <Users size={16} /> {t('admin.tab.users')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* REVENUE SUMMARY CARD */}
                    {isAdmin && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* CARD 1: REVENUE SUMMARY (Refreshed) */}
                            <div className="glass-panel p-6 bg-white border-l-4 border-l-indigo-600 shadow-md flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-lg transition-all">
                                <div className="z-10 relative">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                            <CreditCard size={14} />
                                        </div>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t('admin.rev.title')}</p>
                                    </div>
                                    <h2 className="text-4xl font-black text-slate-800 tracking-tight">${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>

                                    {/* MoM Indicator */}
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className={clsx(
                                            "flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border",
                                            stats.momGrowth >= 0
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                : "bg-red-50 text-red-700 border-red-100"
                                        )}>
                                            {stats.momGrowth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {Math.abs(stats.momGrowth).toFixed(0)}%
                                            <span className="font-normal opacity-70 pl-1 text-[10px] uppercase">{t('admin.rev.mom')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -right-6 -bottom-6 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity rotate-12">
                                    <CreditCard size={140} />
                                </div>
                            </div>

                            {/* CARD 2: SALES CHART */}
                            <div className="glass-panel p-6 bg-white border-l-4 border-l-blue-500 shadow-sm md:col-span-2 h-32 relative overflow-hidden flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-2 z-10 relative">
                                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t('admin.chart.title')}</h3>
                                    <p className="text-xs text-slate-400 font-mono">{t('admin.chart.updated')} {new Date().toLocaleTimeString()}</p>
                                </div>

                                <div className="w-full h-full flex items-end relative z-10">
                                    {stats.dailyTrend.length > 0 ? (
                                        <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-20 overflow-visible drop-shadow-sm">
                                            <defs>
                                                <linearGradient id="chartGradientBlue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            {(() => {
                                                const values = stats.dailyTrend.map(d => d.value);
                                                const max = Math.max(...values, 5);
                                                const points = values.map((val, i) => {
                                                    const x = (i / (values.length - 1)) * 100;
                                                    const y = 25 - ((val / max) * 25);
                                                    return `${x},${y}`;
                                                });

                                                const pathD = `M ${points.join(' L ')}`;
                                                const fillD = `${pathD} L 100,25 L 0,25 Z`;

                                                return (
                                                    <>
                                                        <path d={fillD} fill="url(#chartGradientBlue)" stroke="none" />
                                                        <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                                                    </>
                                                );
                                            })()}
                                        </svg>
                                    ) : (
                                        <div className="w-full text-center text-slate-400 text-xs py-4">{t('admin.chart.no_data')}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {!isAdmin && activeTab === 'settings' && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4 flex items-center gap-2">
                            <AlertTriangle size={20} /> {t('admin.settings.access_denied', { email: ADMIN_EMAIL })}
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && isAdmin && (
                        <div className="glass-panel p-6 bg-white border border-slate-200">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-600">
                                    <CreditCard size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">{t('admin.settings.title')}</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2">{t('admin.settings.cost_protect')}</label>
                                    <input
                                        type="number"
                                        value={config.protectionCost}
                                        onChange={(e) => setConfig({ ...config, protectionCost: Number(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 font-bold"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">{t('admin.settings.desc_protect')}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2">{t('admin.settings.cost_verify')}</label>
                                    <input
                                        type="number"
                                        value={config.verificationCost}
                                        onChange={(e) => setConfig({ ...config, verificationCost: Number(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 font-bold"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">{t('admin.settings.desc_verify')}</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <button
                                    onClick={handleSaveConfig}
                                    disabled={isSavingConfig}
                                    className="px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
                                >
                                    <Save size={20} />
                                    {isSavingConfig ? t('btn.saving') : t('admin.settings.save')}
                                </button>
                            </div>
                        </div>
                    )}


                    {/* LOGS TAB */}
                    {activeTab === 'logs' && (
                        <div className="glass-panel p-6 bg-white border border-slate-200 min-h-[500px]">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <List className="text-slate-400" /> {t('admin.tab.logs')}
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowClearLogsModal(true)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title={t('btn.clear_logs')}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                    <button onClick={loadLogs} className="p-2 text-slate-400 hover:text-blue-500 transition-colors" title={t('btn.reload')}>
                                        <RefreshCw size={20} className={clsx(isLoadingLogs && "animate-spin")} />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-lg border border-slate-200">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3">{t('tbl.timestamp')}</th>
                                            <th className="px-4 py-3">{t('tbl.action')}</th>
                                            <th className="px-4 py-3">{t('tbl.user')}</th>
                                            <th className="px-4 py-3">{t('tbl.details')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {logs.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">{t('admin.logs.empty')}</td>
                                            </tr>
                                        ) : (
                                            logs.map((log, i) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                                    <td className="px-4 py-3 font-bold text-slate-700">
                                                        <span className={clsx(
                                                            "px-2 py-0.5 rounded text-[10px]",
                                                            log.action === 'PROTECT_FILE' ? "bg-green-100 text-green-700" :
                                                                log.action === 'ADMIN_ACCESS' ? "bg-red-100 text-red-700" :
                                                                    "bg-slate-100 text-slate-600"
                                                        )}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">{log.user}</td>
                                                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{log.details}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}


                    {/* USERS TAB */}
                    {activeTab === 'users' && isAdmin && (
                        <div className="glass-panel p-6 bg-white border border-slate-200 min-h-[500px]">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Users className="text-slate-400" /> {t('admin.users.title')}
                                    </h2>
                                    <p className="text-slate-500 text-sm mt-1">
                                        <span className="font-bold text-slate-700">{allUsers.length}</span> {t('admin.users.count')}
                                    </p>
                                </div>

                                <div className="flex gap-2 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder={t('admin.users.search')}
                                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <button onClick={loadUsers} className="p-2 text-slate-400 hover:text-blue-500 transition-colors bg-slate-50 rounded-lg border border-slate-200">
                                        <RefreshCw size={20} className={clsx(isLoadingUsers && "animate-spin")} />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4">{t('tbl.user')}</th>
                                            <th className="px-6 py-4">{t('tbl.status')}</th>
                                            <th className="px-6 py-4 text-center">{t('tbl.credits')}</th>
                                            <th className="px-6 py-4 text-center">{t('tbl.discount')}</th>
                                            <th className="px-6 py-4 text-right">{t('tbl.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {allUsers.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                    {t('admin.users.empty', { query: searchQuery })}
                                                </td>
                                            </tr>
                                        ) : (
                                            allUsers
                                                .filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                                                .map((u) => (
                                                    <tr key={u.email} className="hover:bg-slate-50/80 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">
                                                                    {u.email.substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-slate-700">{u.email}</div>
                                                                    <div className="text-xs text-slate-400 font-mono">ID: {u.email.split('@')[0]}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                                {t('status.active')}
                                                            </span>
                                                            {u.created_at && (
                                                                <div className="text-[10px] text-slate-400 mt-1">
                                                                    {t('lbl.since')}: {new Date(u.created_at).toLocaleDateString()}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={clsx(
                                                                "font-bold text-lg",
                                                                u.credits === 0 ? "text-red-500" : "text-slate-700"
                                                            )}>
                                                                {u.credits}
                                                            </span>
                                                            <span className="text-xs text-slate-400 ml-1">{t('lbl.credits')}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {u.discount > 0 ? (
                                                                <span className="px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                                                                    {u.discount}% {t('lbl.off')}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 text-xs">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => setEditingUser(u)}
                                                                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm flex items-center gap-2 ml-auto"
                                                            >
                                                                <PenSquare size={14} /> {t('btn.manage')}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </SignedIn>

            <EditUserModal
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                user={editingUser}
                onSave={handleUpdateUser}
            />

            <ConfirmationModal
                isOpen={showClearLogsModal}
                onClose={() => setShowClearLogsModal(false)}
                onConfirm={handleClearLogs}
                title={t('btn.clear_logs')}
                message={t('msg.confirm_clear_logs')}
                isDestructive={true}
                isLoading={isClearingLogs}
            />
        </>
    );
}
