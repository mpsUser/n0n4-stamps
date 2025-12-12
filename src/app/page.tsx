'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Shield, FileSignature, Database } from 'lucide-react';
import { useLanguage } from '@/components/Providers';

export default function Home() {
  const { t } = useLanguage();

  return (
    <>
      <Navbar />

      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-5xl px-4 text-center mt-20">
        <div className="mb-4 p-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 text-sm font-medium">
          Protocolo C2PA &bull; {t('footer')}
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs font-bold mb-8 shadow-sm">
          <span className="flex items-center gap-1">
            <Shield size={12} className="fill-current" />
            {t('home.badge.eu_act')}
          </span>
          <span className="w-px h-3 bg-yellow-300 mx-1 opacity-50"></span>
          <span className="opacity-80 font-normal">{t('home.badge.desc')}</span>
        </div>

        <h1 className="text-4xl font-bold mb-6 tracking-tight text-slate-900 leading-tight max-w-4xl mx-auto">
          {t('home.moto')} {t('home.sub')}
        </h1>

        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-12">
          {t('home.desc')}
        </p>

        <div className="flex gap-6 mb-20">
          <Link
            href="/upload"
            className="px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 flex items-center gap-2"
          >
            <FileSignature />
            {t('home.cta.protect')}
          </Link>
          <Link
            href="/verify"
            className="px-8 py-4 glass-panel hover:bg-black/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl font-bold text-lg transition-all flex items-center gap-2"
          >
            <Shield />
            {t('home.cta.verify')}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left">
          <div className="glass-panel p-8">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
              <FileSignature size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">5 Niveles de IA</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Desde N0 (Humano) hasta N4 (Sintético). Declara con precisión la procedencia de tu contenido.
            </p>
          </div>

          <div className="glass-panel p-8">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
              <Database size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Metadatos C2PA</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Estándar industrial que incrusta información de autoría y cambios de manera inmutable en el archivo.
            </p>
          </div>

          <div className="glass-panel p-8">
            <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Créditos de Uso</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Sistema flexible de créditos para gestionar el volumen de autenticaciones. Recarga con tu moneda local.
            </p>
          </div>
        </div>
      </div>

      <footer className="w-full text-center py-8 text-slate-500 dark:text-slate-600 mt-auto">
        <p>© {new Date().getFullYear()} {t('footer')}</p>
      </footer>
    </>
  );
}
