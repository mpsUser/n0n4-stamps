'use client';

import Navbar from '@/components/Navbar';
import { useLanguage } from '@/components/Providers';
import { useEffect, useState } from 'react';
import { FileText, Download, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { getStampUrl, LEVELS, NLevel, StampStyle, StampLanguage } from '@/lib/c2pa';
import Image from 'next/image';
import { getUserUploads } from '@/app/actions';

interface LibItem {
    id: number;
    name: string;
    serverPath?: string;
    level: NLevel;
    style: StampStyle;
    lang?: StampLanguage;
    date: string;
    isImage?: boolean;
}

export default function LibraryPage() {
    const { t } = useLanguage();
    const [items, setItems] = useState<LibItem[]>([]);

    useEffect(() => {
        const loadFiles = async () => {
            const data = await getUserUploads();
            setItems(data as unknown as LibItem[]);
        };
        loadFiles();
    }, []);

    return (
        <>
            <Navbar />

            <div className="w-full max-w-6xl px-4 mt-8 mb-20 text-slate-900">
                <h1 className="text-3xl font-bold mb-2 capitalize">{t('lib.title')}</h1>
                <p className="text-slate-500 mb-8">{t('lib.subtitle')}</p>

                {items.length === 0 ? (
                    <div className="text-center py-20 bg-slate-100 rounded-2xl border border-slate-200">
                        <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">{t('lib.empty')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item) => {
                            const stampUrl = getStampUrl(item.level, item.style, item.lang || 'es');

                            return (
                                <div key={item.id} className="glass-panel p-0 overflow-hidden bg-white border border-slate-200 hover:shadow-lg transition-all group relative">
                                    {/* Preview Area */}
                                    <div className="h-48 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                                        {item.isImage && item.serverPath ? (
                                            <>
                                                {/* Original Image */}
                                                <Image
                                                    src={item.serverPath}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                                {/* Overlay Stamp */}
                                                <div className="absolute top-2 right-2 w-16 h-16 drop-shadow-md backdrop-blur-sm bg-white/20 rounded-full p-1 border border-white/50">
                                                    <Image
                                                        src={stampUrl}
                                                        alt="Stamp"
                                                        fill
                                                        className="object-contain p-1"
                                                        unoptimized
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <FileText size={48} className="text-slate-300" />
                                        )}
                                    </div>

                                    {/* Info Area */}
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-slate-900 truncate pr-2 max-w-[200px]" title={item.name}>{item.name}</h4>
                                            <span
                                                className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                                                style={{ backgroundColor: LEVELS[item.level].color }}
                                            >
                                                N{item.level}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-4">{new Date(item.date).toLocaleDateString()}</p>

                                        <div className="flex gap-2">
                                            {item.serverPath && (
                                                <a
                                                    href={`/api/download?url=${encodeURIComponent(item.serverPath)}&filename=${encodeURIComponent(item.name)}`}
                                                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold flex items-center justify-center transition-colors"
                                                >
                                                    <Download size={16} className="mr-2" /> Download
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
