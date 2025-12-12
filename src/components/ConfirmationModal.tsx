'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2 } from 'lucide-react'; // Added Loader2
import { clsx } from 'clsx'; // Added clsx

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    isLoading?: boolean; // Add to props definition
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    isDestructive = false,
    isLoading = false // Default false
}: ConfirmationModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={isLoading ? undefined : onClose} // Disable backdrop close if loading
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative text-center"
                        >
                            <button
                                onClick={onClose}
                                disabled={isLoading} // Disable close button if loading
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <X size={20} />
                            </button>

                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDestructive ? 'bg-red-100 text-red-500' : 'bg-yellow-100 text-yellow-600'}`}>
                                <AlertTriangle size={32} />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                            <p className="text-slate-500 mb-8">{message}</p>

                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading} // Disable cancel button if loading
                                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={() => { onConfirm(); onClose(); }}
                                    disabled={isLoading} // Disable confirm button if loading
                                    className={clsx(
                                        "flex-1 py-2.5 font-bold rounded-xl text-white transition-colors flex items-center justify-center gap-2",
                                        isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-900 hover:bg-slate-800',
                                        isLoading && 'opacity-70 cursor-not-allowed' // Styling for disabled state
                                    )}
                                >
                                    {isLoading && <Loader2 size={18} className="animate-spin" />} {/* Spinner */}
                                    {isLoading ? "Procesando..." : confirmText} {/* Text change */}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
