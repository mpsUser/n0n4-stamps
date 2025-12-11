'use client';

import { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { protectFile, LEVELS, getStampUrl, type NLevel, type StampStyle, type StampFormat, type StampLanguage } from '@/lib/c2pa';
import { Upload as UploadIcon, X, FileText, CheckCircle, Download, Key, Calendar, Tag, File as FileIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import Image from 'next/image';
import { useLanguage, useCredits } from '@/components/Providers';
import { saveProtectedFile, saveUploadRecord, getUserProfile, UserProfile } from '@/app/actions'; // keep saveProtectedFile if needed elsewhere, but mainly we use the new one now
import { signAndUploadAction } from '@/actions/c2pa';

export default function UploadPage() {
    const { t, language: appLanguage } = useLanguage();
    const { refreshCredits } = useCredits();
    const [file, setFile] = useState<File | null>(null);
    const [level, setLevel] = useState<NLevel>(0);
    const [stampStyle, setStampStyle] = useState<StampStyle>('A');
    const stampFormat: StampFormat = 'SVG';
    // Removed local stampLang state, using appLanguage directly

    const [isProcessing, setIsProcessing] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [protectedUrl, setProtectedUrl] = useState<string | null>(null);
    const [c2paKey, setC2paKey] = useState<string>('');
    const [isMount, setIsMount] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsMount(true);
        // Regenerate key when file opens or just once
        if (file) {
            setC2paKey(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
        }
    }, [file]);

    const validateAndSetFile = (newFile: File) => {
        if (newFile.size > 50 * 1024 * 1024) {
            alert("El archivo excede el límite de 50MB.");
            return;
        }
        setFile(newFile);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) validateAndSetFile(droppedFile);
    };

    const currentLevelData = LEVELS[level];

    const handleProtection = async () => {
        if (!file) return;
        setIsProcessing(true);

        const timestamp = Date.now();
        const newName = `${timestamp}_${file.name}`; // Unique name

        // Metadata to be signed
        const metadata = {
            author: 'Usuario Demo',
            level,
            levelLabel: appLanguage === 'es' ? currentLevelData.label_es : currentLevelData.label_en,
            stampStyle,
            stampFormat,
            stampLanguage: appLanguage === 'es' ? 'es' : 'en',
            timestamp: new Date().toISOString(),
            c2pa_key: c2paKey
        };

        const formData = new FormData();
        formData.append('file', file);
        formData.append('newName', newName);

        try {
            // New Server Action: Signs (if possible) and Uploads
            const result = await signAndUploadAction(formData, metadata);

            if (result.success && result.signedUrl) {
                setProtectedUrl(result.signedUrl);

                if (result.isFallback) {
                    // Optional: Notify user that signing was simulated due to dev certs
                    console.log("Note: File was uploaded but signing fell back to original/simulated due to dev environment.");
                }

                // Save to Server DB (User Isolated)
                await saveUploadRecord({
                    id: timestamp,
                    name: file.name,
                    serverPath: result.signedUrl,
                    level,
                    style: stampStyle,
                    lang: appLanguage,
                    date: new Date().toISOString(),
                    isImage: file.type.startsWith('image/')
                });

                // Update UI credits
                await refreshCredits();

                setIsDone(true);
            } else {
                alert(result.error || "Error uploading file");
            }
        } catch (e: any) {
            console.error("Upload failed", e);
            alert("Error uploading file: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setIsDone(false);
        setLevel(0);
        setProtectedUrl(null);
    };

    return (
        <>
            <Navbar />

            <div className="w-full max-w-6xl px-4 mt-12 mb-20 text-slate-900 font-sans">
                <h1 className="text-3xl font-bold mb-2">{t('upload.title')}</h1>
                <p className="text-slate-500 mb-8">{t('upload.desc')}</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT: Upload & Metadata Preview */}
                    <div className="flex flex-col gap-6">
                        {!file ? (
                            <div
                                className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-slate-50 rounded-2xl h-80 flex flex-col items-center justify-center cursor-pointer transition-all gap-4 bg-white"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <UploadIcon size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-lg">{t('upload.drop')}</p>
                                    <p className="text-sm text-slate-500 mt-1">{t('upload.support')}</p>
                                </div>
                                <input
                                    type="file"
                                    hidden
                                    ref={fileInputRef}
                                    onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
                                />
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-panel p-6 relative h-80 flex flex-col items-center justify-center bg-white border border-slate-200"
                            >
                                {!isDone && (
                                    <button onClick={reset} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 z-10">
                                        <X />
                                    </button>
                                )}

                                {isDone ? (
                                    <div className="text-center text-green-500 animate-pulse">
                                        <CheckCircle size={64} className="mx-auto mb-4" />
                                        <h3 className="text-2xl font-bold">{t('upload.done')}</h3>
                                    </div>
                                ) : (
                                    <>
                                        {file.type.startsWith('image/') ? (
                                            <div className="relative w-full h-full p-4">
                                                <Image
                                                    src={URL.createObjectURL(file)}
                                                    alt="preview"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <FileText size={48} className="text-blue-500 mb-4" />
                                                <p className="text-lg font-medium truncate max-w-xs">{file.name}</p>
                                                <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        )}

                        {/* Metadata Preview Panel (Replaces Stamp Preview) */}
                        <div className="glass-panel p-6 bg-white border border-slate-200">
                            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-4 flex items-center gap-2">
                                <FileIcon size={14} /> Metadatos a Insertar
                            </p>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <FileText size={16} />
                                        <span className="text-sm font-medium">{t('meta.name')}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{file ? file.name : '---'}</span>
                                </div>

                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Calendar size={16} />
                                        <span className="text-sm font-medium">{t('meta.date')}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">
                                        {isMount ? new Date().toLocaleDateString() : '---'}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Tag size={16} />
                                        <span className="text-sm font-medium">{t('meta.type')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: currentLevelData.color }}
                                        ></span>
                                        <span className="text-sm font-bold text-slate-900">
                                            N{level} - {appLanguage === 'es' ? currentLevelData.label_es : currentLevelData.label_en}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Key size={16} />
                                        <span className="text-sm font-medium">{t('meta.key')}</span>
                                    </div>
                                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">
                                        {file ? `c2pa_${c2paKey}` : '---'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Controls */}
                    <div className="flex flex-col gap-6">

                        {/* 1. Level Selector */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">1</span>
                                {t('upload.step1')}
                            </h3>
                            <div className="space-y-2">
                                {LEVELS.map((L) => (
                                    <button
                                        key={L.level}
                                        onClick={() => setLevel(L.level as NLevel)}
                                        className={clsx(
                                            "w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group",
                                            level === L.level
                                                ? "bg-blue-50 border-blue-500 shadow-sm"
                                                : "bg-white border-slate-200 hover:border-slate-400"
                                        )}
                                    >
                                        <div>
                                            <span className={clsx("font-bold block", level === L.level ? "text-blue-600" : "text-slate-600")}>
                                                N{L.level} - {appLanguage === 'es' ? L.label_es : L.label_en}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {appLanguage === 'es' ? L.description_es : L.description_en}
                                            </span>
                                        </div>

                                        {/* Mini Stamp Icon */}
                                        <div className="w-8 h-8 relative opacity-90 group-hover:opacity-100 transition-opacity">
                                            <Image
                                                src={getStampUrl(L.level as NLevel, stampStyle, appLanguage === 'es' ? 'es' : 'en')}
                                                alt="Mini Stamp"
                                                fill
                                                className="object-contain"
                                                unoptimized
                                            />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Style (Full Width now) */}
                        <div>
                            <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">2</span>
                                {t('upload.step2')}
                            </h3>
                            <div className="flex gap-2">
                                {(['A', 'B', 'C'] as StampStyle[]).map((style) => (
                                    <button
                                        key={style}
                                        onClick={() => setStampStyle(style)}
                                        className={clsx(
                                            "px-4 py-2 rounded-lg border font-bold transition-all flex-1",
                                            stampStyle === style
                                                ? "bg-blue-500 text-white border-blue-500"
                                                : "bg-white border-slate-300 hover:bg-slate-50"
                                        )}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Action Button */}
                    <div className="mt-4">
                        {!isDone ? (
                            <button
                                onClick={handleProtection}
                                disabled={!file || isProcessing}
                                className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                                ) : (
                                    <>{t('upload.btn.protect')}</>
                                )}
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <button
                                    onClick={() => {
                                        if (!protectedUrl) return;
                                        const filename = protectedUrl.split('/').pop() || 'protected-file';
                                        const proxyUrl = `/api/download?url=${encodeURIComponent(protectedUrl)}&filename=${encodeURIComponent(filename)}`;
                                        window.location.href = proxyUrl;
                                    }}
                                    className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Download /> {t('upload.btn.download')}
                                </button>

                                <button onClick={reset} className="w-full py-2 text-slate-500 hover:text-slate-800 text-sm underline">
                                    {t('upload.btn.other')}
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}
