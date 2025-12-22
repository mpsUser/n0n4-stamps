'use client';

import Navbar from '@/components/Navbar';
import { useLanguage } from '@/components/Providers';
import { useEffect, useState } from 'react';
import { FileText, Download, Image as ImageIcon, Trash2, LayoutGrid, List as ListIcon, User } from 'lucide-react';
import { clsx } from 'clsx';
import { getStampUrl, LEVELS, NLevel, StampStyle, StampLanguage } from '@/lib/c2pa';
import Image from 'next/image';
import { getUserUploads, deleteFile } from '@/app/actions';
import { useUser } from '@clerk/nextjs';
import ConfirmationModal from '@/components/ConfirmationModal';

interface LibItem {
    id: string; // UUID
    name: string;
    serverPath?: string;
    level: NLevel;
    style: StampStyle;
    lang?: StampLanguage;
    date: string;
    email?: string;
    isImage?: boolean;
}

const ADMIN_EMAIL = 'marcpedrero@gmail.com';

export default function LibraryPage() {
    const { t } = useLanguage();
    const { user } = useUser();
    const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

    const [items, setItems] = useState<LibItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // UI State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterLevel, setFilterLevel] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    // Modal State
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, path?: string } | null>(null);

    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {
        setIsLoading(true);
        const data = await getUserUploads();
        setItems(data as unknown as LibItem[]);
        setIsLoading(false);
    };

    const handleDeleteClick = (id: string, path?: string) => {
        setDeleteTarget({ id, path });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        const { id, path } = deleteTarget;

        // Optimistic UI update
        setItems(prev => prev.filter(i => i.id !== id));
        setDeleteTarget(null);

        if (path) {
            const res = await deleteFile(id, path);
            if (!res.success) {
                alert('Failed to delete: ' + res.error);
                loadFiles(); // Revert on failure
            }
        }
    };

    // Filter & Sort Logic
    const filteredItems = items
        .filter(item => filterLevel === 'all' || item.level.toString() === filterLevel)
        .sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

    return (
        <>
            <Navbar />

            <ConfirmationModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="¿Eliminar archivo?"
                message="Esta acción no se puede deshacer. El archivo se eliminará permanentemente de tu librería."
                confirmText="Eliminar"
                isDestructive={true}
            />

            <div className="w-full max-w-6xl px-4 mt-8 mb-20 text-slate-900">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-1 capitalize">{t('lib.title')}</h1>
                        <p className="text-slate-500">{t('lib.subtitle')}</p>
                    </div>

                    {/* TOOLBAR */}
                    <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                        {/* View Toggle */}
                        <div className="flex bg-slate-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={clsx("p-2 rounded-md transition-all", viewMode === 'grid' ? "bg-white shadow text-slate-900" : "text-slate-400 hover:text-slate-600")}
                                title="Grid View"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={clsx("p-2 rounded-md transition-all", viewMode === 'list' ? "bg-white shadow text-slate-900" : "text-slate-400 hover:text-slate-600")}
                                title="List View"
                            >
                                <ListIcon size={18} />
                            </button>
                        </div>

                        <div className="w-px h-8 bg-slate-200 mx-1"></div>

                        {/* Filters */}
                        <select
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                        >
                            <option value="all">Filtro Nivel AI</option>
                            {LEVELS.map((l) => (
                                <option key={l.level} value={l.level.toString()}>
                                    N{l.level} - {l.label_es}
                                </option>
                            ))}
                        </select>

                        <select
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as any)}
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-20"><div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-slate-400 rounded-full" role="status"></div></div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">{t('lib.empty')}</p>
                    </div>
                ) : (
                    <>
                        {/* GRID VIEW */}
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredItems.map((item) => {
                                    const stampUrl = getStampUrl(item.level, item.style, item.lang || 'es');
                                    return (
                                        <div key={item.id} className="glass-panel p-0 overflow-hidden bg-white border border-slate-200 hover:shadow-lg transition-all group relative animate-in fade-in duration-500">
                                            {/* Preview Area */}
                                            <div className="h-48 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                                                {(item.isImage && item.serverPath) ? (
                                                    <>
                                                        <Image
                                                            src={item.serverPath!}
                                                            alt={item.name}
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                        <div className="absolute top-2 right-2 w-16 h-16 drop-shadow-md backdrop-blur-sm bg-white/20 rounded-full p-1 border border-white/50">
                                                            <Image src={stampUrl} alt="Stamp" fill className="object-contain p-1" unoptimized />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <FileText size={48} className="text-slate-300" />
                                                )}

                                                {/* Hover Action Overlay */}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    {item.serverPath && (
                                                        <a href={`/api/download?url=${encodeURIComponent(item.serverPath)}&filename=${encodeURIComponent(item.name)}`} className="p-3 bg-white text-slate-900 rounded-full hover:bg-slate-100 transition shadow-lg" title="Download">
                                                            <Download size={20} />
                                                        </a>
                                                    )}
                                                    <button onClick={() => handleDeleteClick(item.id, item.serverPath)} className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg" title="Delete">
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Info Area */}
                                            <div className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-slate-900 truncate pr-2 max-w-[200px]" title={item.name}>{item.name}</h4>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase" style={{ backgroundColor: LEVELS[item.level].color }}>
                                                        N{item.level}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-slate-500">
                                                    <span>{new Date(item.date).toLocaleDateString()}</span>
                                                    {isAdmin && item.email && (
                                                        <span className="flex items-center gap-1 text-slate-400" title={`Owner: ${item.email}`}>
                                                            <User size={10} /> {item.email.split('@')[0]}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* LIST VIEW */}
                        {viewMode === 'list' && (
                            <div className="glass-panel p-0 bg-white border border-slate-200 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3 w-16">Preview</th>
                                            <th className="px-4 py-3">File Name</th>
                                            <th className="px-4 py-3 text-center">Level</th>
                                            <th className="px-4 py-3">Date</th>
                                            {isAdmin && <th className="px-4 py-3">Owner</th>}
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-2">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden relative border border-slate-200 flex items-center justify-center">
                                                        {(item.isImage && item.serverPath) ? (
                                                            <Image src={item.serverPath!} alt="" fill className="object-cover" unoptimized />
                                                        ) : (
                                                            <FileText size={20} className="text-slate-300" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 font-medium text-slate-900 max-w-[200px] truncate" title={item.name}>
                                                    {item.name}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <span className="px-2 py-1 rounded text-[10px] font-bold text-white uppercase" style={{ backgroundColor: LEVELS[item.level].color }}>
                                                        N{item.level}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-slate-500">
                                                    {new Date(item.date).toLocaleDateString()}
                                                </td>
                                                {isAdmin && (
                                                    <td className="px-4 py-2 text-slate-500 text-xs truncate max-w-[150px]">
                                                        {item.email || '-'}
                                                    </td>
                                                )}
                                                <td className="px-4 py-2 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {item.serverPath && (
                                                            <a href={`/api/download?url=${encodeURIComponent(item.serverPath)}&filename=${encodeURIComponent(item.name)}`} className="p-2 text-slate-400 hover:text-blue-600 transition" title="Download">
                                                                <Download size={18} />
                                                            </a>
                                                        )}
                                                        <button onClick={() => handleDeleteClick(item.id, item.serverPath)} className="p-2 text-slate-400 hover:text-red-500 transition" title="Delete">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
