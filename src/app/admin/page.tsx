'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Settings, Save, User as UserIcon, CreditCard, Activity, List, RefreshCw, Lock, AlertTriangle, Users, Plus, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import { getLogs, ActivityLog, adminGetAllUsers, adminUpdateUser, getConfig, updateConfig, UserProfile, AppConfig, getFinancialStats } from '@/app/actions';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';
import { useCredits } from '@/components/Providers';

const ADMIN_EMAIL = 'marcpedrero@gmail.com';

export default function AdminPage() {
    const { user, isLoaded } = useUser();
    const { refreshCredits } = useCredits();

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

    // Revenue State
    const [totalRevenue, setTotalRevenue] = useState(0);

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

    const loadRevenue = async () => {
        const stats = await getFinancialStats();
        setTotalRevenue(stats.revenue);
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
        alert('Global Pricing Updated');
    };

    const handleUpdateUser = async (email: string, changes: Partial<UserProfile>) => {
        await adminUpdateUser(email, changes);
        await loadUsers(); // reload list

        // If updating self, refresh client context
        if (email === user?.primaryEmailAddress?.emailAddress) {
            refreshCredits();
        }
    };

    if (!isLoaded) return <div className="p-10 text-center">Loading...</div>;

    return (
        <>
            <Navbar />
            <SignedOut>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="bg-red-50 p-8 rounded-2xl text-center border border-red-100">
                        <Lock size={48} className="text-red-400 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-red-900 mb-2">Acceso Restringido</h1>
                        <p className="text-red-700 mb-6">Debes iniciar sesión para acceder al panel de administración.</p>
                        <SignInButton mode="modal">
                            <button className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition">
                                Iniciar Sesión
                            </button>
                        </SignInButton>
                    </div>
                </div>
            </SignedOut>
            <SignedIn>
                <div className="w-full max-w-5xl px-4 mt-12 mb-20 text-slate-900">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Panel de Administrador</h1>
                            <p className="text-slate-500">Gestión de sistema, precios y auditoría.</p>
                        </div>

                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {isAdmin && (
                                <button
                                    onClick={() => setActiveTab('settings')}
                                    className={clsx("px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2", activeTab === 'settings' ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700")}
                                >
                                    <Settings size={16} /> Configuración
                                </button>
                            )}
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={clsx("px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2", activeTab === 'logs' ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700")}
                            >
                                <Activity size={16} /> Activity Log
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => setActiveTab('users')}
                                    className={clsx("px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2", activeTab === 'users' ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700")}
                                >
                                    <Users size={16} /> Usuarios
                                </button>
                            )}
                        </div>
                    </div>

                    {/* REVENUE SUMMARY CARD */}
                    {isAdmin && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="glass-panel p-6 flex flex-col justify-between h-32 bg-white border-l-4 border-l-emerald-500 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                                        <h2 className="text-3xl font-bold text-slate-900 mt-1">${totalRevenue.toFixed(2)}</h2>
                                    </div>
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                        <CreditCard size={20} />
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400">Life-time gross revenue</div>
                            </div>
                        </div>
                    )}

                    {!isAdmin && activeTab === 'settings' && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4 flex items-center gap-2">
                            <AlertTriangle size={20} /> Access Denied: Only {ADMIN_EMAIL} can edit settings.
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && isAdmin && (
                        <div className="glass-panel p-6 bg-white border border-slate-200">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-600">
                                    <CreditCard size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">Precios Globales (Créditos)</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2">Coste: Protección de Archivo</label>
                                    <input
                                        type="number"
                                        value={config.protectionCost}
                                        onChange={(e) => setConfig({ ...config, protectionCost: Number(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 font-bold"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Créditos deducidos al proteger.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2">Coste: Verificación</label>
                                    <input
                                        type="number"
                                        value={config.verificationCost}
                                        onChange={(e) => setConfig({ ...config, verificationCost: Number(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 font-bold"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Créditos deducidos al verificar.</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <button
                                    onClick={handleSaveConfig}
                                    disabled={isSavingConfig}
                                    className="px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
                                >
                                    <Save size={20} />
                                    {isSavingConfig ? 'Guardando...' : 'Guardar Precios'}
                                </button>
                            </div>
                        </div>
                    )}


                    {/* LOGS TAB */}
                    {activeTab === 'logs' && (
                        <div className="glass-panel p-6 bg-white border border-slate-200 min-h-[500px]">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <List className="text-slate-400" /> Registro de Actividad
                                </h2>
                                <button onClick={loadLogs} className="p-2 text-slate-400 hover:text-blue-500 transition-colors" title="Reload">
                                    <RefreshCw size={20} className={clsx(isLoadingLogs && "animate-spin")} />
                                </button>
                            </div>

                            <div className="overflow-hidden rounded-lg border border-slate-200">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3">Timestamp</th>
                                            <th className="px-4 py-3">Action</th>
                                            <th className="px-4 py-3">User</th>
                                            <th className="px-4 py-3">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {logs.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No logs found.</td>
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
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Users className="text-slate-400" /> Gestión de Usuarios y Créditos
                                    </h2>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Total Usuarios: {allUsers.length} |
                                        Total Créditos en Circulación: {allUsers.reduce((acc, u) => acc + u.credits, 0)}
                                    </p>
                                </div>
                                <button onClick={loadUsers} className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                                    <RefreshCw size={20} className={clsx(isLoadingUsers && "animate-spin")} />
                                </button>
                            </div>

                            <div className="overflow-hidden rounded-lg border border-slate-200">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3">Email</th>
                                            <th className="px-4 py-3 text-center">Créditos</th>
                                            <th className="px-4 py-3 text-center">Descuento (%)</th>
                                            <th className="px-4 py-3 text-center">Gestión</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {allUsers.map((u) => (
                                            <tr key={u.email} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-900">{u.email}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="font-bold text-lg text-slate-700">{u.credits}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <input
                                                            type="number"
                                                            className="w-12 border rounded px-1 py-0.5 text-center text-xs"
                                                            value={u.discount}
                                                            onChange={(e) => handleUpdateUser(u.email, { discount: Number(e.target.value) })}
                                                        />
                                                        <span className="text-xs text-slate-400">%</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleUpdateUser(u.email, { credits: u.credits + 10 })}
                                                        className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200" title="+10 Credits"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateUser(u.email, { credits: Math.max(0, u.credits - 10) })}
                                                        className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200" title="-10 Credits"
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </SignedIn>
        </>
    );
}
