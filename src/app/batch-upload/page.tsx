'use client';

import { useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { protectFile, LEVELS, type NLevel, type StampStyle, type StampFormat, type StampLanguage } from '@/lib/c2pa';
import { Upload as UploadIcon, X, FileText, CheckCircle, Play, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useLanguage } from '@/components/Providers';

interface QueueItem {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'done';
}

export default function BatchUploadPage() {
    const { t, language: appLanguage } = useLanguage();
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [level, setLevel] = useState<NLevel>(0);
    const [stampStyle, setStampStyle] = useState<StampStyle>('A');
    // Enforce SVG
    const stampFormat: StampFormat = 'SVG';
    const [stampLang, setStampLang] = useState<StampLanguage>(appLanguage);

    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    };

    const addFiles = (files: File[]) => {
        const newItems = files.map(f => ({
            id: Math.random().toString(36).substr(2, 9),
            file: f,
            status: 'pending' as const
        }));
        setQueue(prev => [...prev, ...newItems]);
    };

    const removeFile = (id: string) => {
        setQueue(prev => prev.filter(item => item.id !== id));
    };

    const currentLevelData = LEVELS[level];

    const processQueue = async () => {
        setIsProcessing(true);

        for (const item of queue) {
            if (item.status === 'done') continue;

            setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing' } : i));

            await protectFile(item.file, {
                author: 'Batch User',
                level,
                levelLabel: appLanguage === 'es' ? LEVELS[level].label_es : LEVELS[level].label_en,
                stampStyle,
                stampFormat,
                stampLanguage: stampLang,
                timestamp: new Date().toISOString()
            });

            const existingLib = JSON.parse(localStorage.getItem('n0n4_library') || '[]');
            existingLib.unshift({
                id: Date.now() + Math.random(),
                name: item.file.name,
                level,
                style: stampStyle,
                date: new Date().toISOString()
            });
            localStorage.setItem('n0n4_library', JSON.stringify(existingLib));

            setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'done' } : i));
        }

        setIsProcessing(false);
    };

    return (
        <>
            <Navbar />

            <div className="w-full max-w-6xl px-4 mt-8 mb-20 text-slate-900">
                <h1 className="text-3xl font-bold mb-2">{t('batch.title')}</h1>
                <p className="text-slate-500 mb-8">{t('batch.subtitle')}</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass-panel p-6 bg-white">
                            <h3 className="font-bold mb-4 border-b border-slate-200 pb-2">{t('batch.global')}</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">{t('upload.step1')}</label>
                                    <select
                                        value={level}
                                        onChange={(e) => setLevel(Number(e.target.value) as NLevel)}
                                        className="w-full mt-1 p-2 rounded bg-slate-50 border border-slate-300"
                                    >
                                        {LEVELS.map(l => (
                                            <option key={l.level} value={l.level}>
                                                N{l.level} - {appLanguage === 'es' ? l.label_es : l.label_en}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">{t('upload.step2')}</label>
                                    <div className="flex gap-2 mt-1">
                                        {(['A', 'B', 'C'] as StampStyle[]).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setStampStyle(s)}
                                                className={clsx("flex-1 p-1 rounded border text-sm font-bold", stampStyle === s ? "bg-blue-500 text-white" : "border-slate-300 bg-white")}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">{t('upload.step3')}</label>
                                    <div className="flex gap-2 mt-1">
                                        <button onClick={() => setStampLang('es')} className={clsx("flex-1 p-1 rounded border text-sm", stampLang === 'es' ? "bg-slate-200" : "bg-white border-slate-300")}>ES</button>
                                        <button onClick={() => setStampLang('en')} className={clsx("flex-1 p-1 rounded border text-sm", stampLang === 'en' ? "bg-slate-200" : "bg-white border-slate-300")}>EN</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={processQueue}
                            disabled={queue.length === 0 || isProcessing}
                            className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                        >
                            {isProcessing ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : <Play size={20} />}
                            {t('batch.btn')} ({queue.filter(i => i.status === 'pending').length})
                        </button>
                    </div>

                    {/* Queue Area */}
                    <div className="lg:col-span-2">
                        <div
                            className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-white/50 rounded-2xl h-32 flex flex-col items-center justify-center cursor-pointer transition-all mb-6 bg-white/40"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <UploadIcon className="text-slate-400 mb-2" />
                            <p className="font-medium text-slate-500">{t('batch.add')}</p>
                            <input type="file" hidden multiple ref={fileInputRef} onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))} />
                        </div>

                        <div className="space-y-3">
                            {queue.map((item) => (
                                <div key={item.id} className="glass-panel p-3 flex items-center justify-between bg-white">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        {item.status === 'done' ? (
                                            <CheckCircle size={20} className="text-green-500 shrink-0" />
                                        ) : item.status === 'processing' ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 shrink-0"></div>
                                        ) : (
                                            <FileText size={20} className="text-slate-400 shrink-0" />
                                        )}
                                        <span className="truncate font-medium">{item.file.name}</span>
                                    </div>

                                    {item.status === 'pending' && (
                                        <button onClick={() => removeFile(item.id)} className="text-red-400 hover:text-red-500">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                    {item.status === 'done' && (
                                        <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">ok</span>
                                    )}
                                </div>
                            ))}
                            {queue.length === 0 && (
                                <p className="text-center text-slate-500 py-10">{t('batch.empty')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
