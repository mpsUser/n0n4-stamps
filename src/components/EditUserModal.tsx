'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, CreditCard, Percent } from 'lucide-react';
import { useState, useEffect } from 'react';
import { UserProfile } from '@/app/actions';
import { useLanguage } from './Providers';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserProfile | null;
    onSave: (email: string, changes: Partial<UserProfile>) => Promise<void>;
}

export default function EditUserModal({ isOpen, onClose, user, onSave }: EditUserModalProps) {
    const { t } = useLanguage();
    const [credits, setCredits] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setCredits(user.credits);
            setDiscount(user.discount);
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            await onSave(user.email, { credits, discount });
            onClose();
        } catch (e) {
            alert('Failed to update user');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && user && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-0 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <User size={18} className="text-slate-500" />
                                    {t('admin.users.edit')}
                                </h3>
                                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('admin.users.email')}</label>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-700 font-medium text-sm">
                                        {user.email}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
                                            <CreditCard size={16} className="text-blue-500" /> {t('tbl.credits')}
                                        </label>
                                        <input
                                            type="number"
                                            value={credits}
                                            onChange={(e) => setCredits(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full border border-slate-300 rounded-xl px-4 py-2 font-bold text-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        />
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={() => setCredits(c => c + 10)} className="flex-1 bg-blue-50 text-blue-600 text-xs font-bold py-1 rounded hover:bg-blue-100 transition">+10</button>
                                            <button onClick={() => setCredits(c => c + 50)} className="flex-1 bg-blue-50 text-blue-600 text-xs font-bold py-1 rounded hover:bg-blue-100 transition">+50</button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
                                            <Percent size={16} className="text-orange-500" /> {t('tbl.discount')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={discount}
                                                onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                                className="w-full border border-slate-300 rounded-xl px-4 py-2 font-bold text-lg text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none pr-8"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={() => setDiscount(0)} className="flex-1 bg-slate-50 text-slate-500 text-xs font-bold py-1 rounded hover:bg-slate-100 transition">0%</button>
                                            <button onClick={() => setDiscount(20)} className="flex-1 bg-orange-50 text-orange-600 text-xs font-bold py-1 rounded hover:bg-orange-100 transition">20%</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 pt-0 flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition"
                                >
                                    {t('btn.cancel')}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? t('btn.saving') : <><Save size={18} /> {t('btn.save')}</>}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
