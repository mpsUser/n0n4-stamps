'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { ShieldCheck, FileUp, Info, Settings, LayoutDashboard, FolderOpen, Globe, Sparkles } from 'lucide-react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { useLanguage, useCredits } from './Providers';
import { useEffect, useState } from 'react';

export default function Navbar() {
    const pathname = usePathname();
    const { t, language, setLanguage } = useLanguage();
    const { credits, refreshCredits } = useCredits();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const navItems = [
        { name: t('nav.home'), href: '/', icon: null },
        { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
        { name: t('nav.library'), href: '/library', icon: FolderOpen },
        { name: t('nav.protect'), href: '/upload', icon: FileUp },
        { name: t('nav.verify'), href: '/verify', icon: ShieldCheck },
        { name: t('nav.admin'), href: '/admin', icon: Settings },
    ];

    if (!mounted) return null;

    return (
        <nav className="w-full max-w-6xl mt-6 px-6 py-4 glass-panel flex items-center justify-between z-50">
            <Link href="/" className="text-2xl font-bold tracking-tight text-slate-900">
                <span className="text-gradient">N0N4</span>
            </Link>

            <div className="flex gap-4 items-center">
                {/* Nav Links */}
                <div className="hidden md:flex gap-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                                    isActive
                                        ? "bg-black/10 text-black font-medium"
                                        : "text-slate-500 hover:text-black hover:bg-black/5"
                                )}
                            >
                                {Icon && <Icon size={16} />}
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className="h-6 w-px bg-slate-300 mx-2"></div>

                <div className="flex items-center gap-2">
                    <SignedIn>
                        <Link
                            href="/credits"
                            className="group mr-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-slate-900 to-slate-800 text-white text-sm font-bold hover:shadow-lg transition-all flex items-center gap-2 shadow-md ring-1 ring-white/20"
                        >
                            <Sparkles size={14} className="text-yellow-400" />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-white">
                                {credits} créditos
                            </span>
                        </Link>
                    </SignedIn>

                    <button
                        onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-sm font-bold min-w-[80px] justify-center transition-all shadow-sm text-slate-700"
                    >
                        <Globe size={16} className="text-slate-400" />
                        {language === 'es' ? 'ES' : 'EN'}
                    </button>

                    <div className="ml-2 pl-2 border-l border-slate-300">
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="px-4 py-1.5 rounded-md bg-black text-white text-sm font-bold hover:bg-slate-800 transition-colors">
                                    Sign In
                                </button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>
                    </div>
                </div>
            </div>
        </nav>
    );
}
