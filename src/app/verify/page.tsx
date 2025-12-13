'use client';

import { useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/components/Providers';
import { ShieldCheck, Upload as UploadIcon, CheckCircle, XCircle, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { verifyC2PA, C2PAMetadata } from '@/lib/c2pa';
import { logActivity, chargeUser } from '@/app/actions';
import { verifyAction } from '@/actions/c2pa';
import { useUser } from '@clerk/nextjs';
import { useCredits } from '@/components/Providers';

export default function VerifyPage() {
    const { t } = useLanguage();
    const { user } = useUser();
    const { refreshCredits } = useCredits();
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<C2PAMetadata | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanDone, setScanDone] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) requestVerify(droppedFile);
    };

    const requestVerify = async (f: File) => {
        if (!user) {
            alert('Please sign in to verify files.');
            return;
        }

        // Enforce credit charge
        try {
            await chargeUser('VERIFY');
            await refreshCredits();
        } catch (e: any) {
            alert(e.message || 'No credits available');
            return;
        }

        setFile(f);
        setIsScanning(true);
        setScanDone(false);
        setResult(null);

        const formData = new FormData();
        formData.append('file', f);

        try {
            // Call Server Action
            const response = await verifyAction(formData);

            // Artificial delay for scanning effect
            setTimeout(() => {
                setIsScanning(false);
                setScanDone(true);

                if (response.success && response.metadata) {
                    setResult(response.metadata);
                    const email = user?.primaryEmailAddress?.emailAddress || 'Unknown';
                    logActivity('VERIFY_FILE', `Verified file: ${f.name} (Valid)`, email);
                } else {
                    setResult(null);
                    // Optionally show specific error: response.error
                }
            }, 1000);

        } catch (e) {
            console.error("Verification request failed", e);
            setIsScanning(false);
            setResult(null);
        }
    }

    return (
        <>
            <Navbar />
            <div className="w-full max-w-2xl px-4 mt-12 mb-20 text-slate-900">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold mb-2">{t('verify.title')}</h1>
                    <p className="text-slate-500">{t('verify.desc')}</p>
                </div>

                <div
                    className="glass-panel p-8 min-h-[400px] flex flex-col items-center justify-center border-2 border-slate-200 bg-white"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    {!file ? (
                        <div
                            className="text-center cursor-pointer p-10 w-full h-full flex flex-col items-center justify-center hover:bg-slate-50 rounded-xl transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6">
                                <ShieldCheck size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">{t('verify.drop')}</h3>
                            <p className="text-slate-400 text-sm">JPG, PNG, PDF, MP4</p>
                            <input type="file" hidden ref={fileInputRef} onChange={(e) => e.target.files?.[0] && requestVerify(e.target.files[0])} />
                        </div>
                    ) : (
                        <div className="w-full">
                            {isScanning ? (
                                <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                                    <p className="text-lg font-medium text-slate-600">{t('verify.scanning')}</p>
                                </div>
                            ) : scanDone && result ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center"
                                >
                                    <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                                    <h2 className="text-2xl font-bold text-green-700 mb-6">{t('verify.valid')}</h2>

                                    <div className="grid grid-cols-2 gap-4 text-left bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-bold">{t('verify.author')}</p>
                                            <p className="font-semibold text-slate-700">{result.author}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-bold">{t('verify.date')}</p>
                                            <p className="font-semibold text-slate-700">{new Date(result.timestamp).toLocaleDateString()}</p>
                                        </div>

                                        {/* C2PA Key Showcase */}
                                        {result.c2pa_key && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-slate-400 uppercase font-bold">{t('meta.key')}</p>
                                                <div className="flex items-center gap-1 text-slate-600 bg-slate-50 p-1 px-2 rounded mt-1">
                                                    <Key size={12} />
                                                    <code className="text-xs font-mono break-all">c2pa_{result.c2pa_key}</code>
                                                </div>
                                            </div>
                                        )}

                                        <div className="col-span-2 border-t pt-4 mt-2">
                                            <p className="text-xs text-slate-400 uppercase font-bold mb-2">{t('verify.declared')}</p>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full bg-n${result.level}`}></div>
                                                <p className="font-bold text-lg text-slate-800">N{result.level} - {result.levelLabel}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setFile(null)}
                                        className="mt-6 text-green-600 font-bold hover:underline"
                                    >
                                        Verificar otro archivo
                                    </button>
                                </motion.div>
                            ) : (
                                <div className="text-center">
                                    <XCircle size={48} className="text-red-500 mx-auto mb-4" />
                                    <h2 className="text-2xl font-bold text-red-600 mb-4">{t('verify.invalid')}</h2>
                                    <p className="text-slate-500 mb-6">No se encontraron metadatos C2PA en este archivo.</p>
                                    <button
                                        onClick={() => setFile(null)}
                                        className="text-slate-600 font-bold hover:underline"
                                    >
                                        Intentar de nuevo
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
