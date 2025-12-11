'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { getUserProfile } from '@/app/actions';
import { useUser } from '@clerk/nextjs';

type Language = 'es' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// CREDITS CONTEXT
interface CreditsContextType {
    credits: number;
    credits: number;
    refreshCredits: () => Promise<void>;
    userDiscount: number; // Percentage 0-100
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

// FULL DICTIONARY
const translations: Record<string, Record<Language, string>> = {
    // Config
    'lang.es': { es: 'Español', en: 'Spanish' },
    'lang.en': { es: 'Inglés', en: 'English' },

    // Navbar
    'nav.home': { es: 'Inicio', en: 'Home' },
    'nav.protect': { es: 'Proteger', en: 'Protect' },
    'nav.verify': { es: 'Verificar', en: 'Verify' },
    'nav.library': { es: 'Librería', en: 'Library' },
    'nav.dashboard': { es: 'Panel', en: 'Dashboard' },
    'nav.help': { es: 'Ayuda', en: 'Help' },
    'nav.admin': { es: 'Admin', en: 'Admin' },

    // Home
    'home.moto': { es: 'Uso responsable de la IA', en: 'Responsible use of AI' }, // As requested: "Uso responsable de la IA"
    'home.sub': { es: 'para Información Documentada', en: 'for Documented Information' }, // Keeping sub
    'home.desc': {
        es: 'N0N4 te permite certificar el nivel de intervención de Inteligencia Artificial en tus archivos, protegiendo la autoría con el estándar C2PA.',
        en: 'N0N4 allows you to certify the level of Artificial Intelligence intervention in your files, protecting authorship with the C2PA standard.'
    },
    'home.cta.protect': { es: 'Comenzar a Proteger', en: 'Start Protecting' },
    'home.cta.verify': { es: 'Verificar Archivo', en: 'Verify File' },
    'home.feat.level': { es: '5 Niveles de IA', en: '5 AI Levels' },
    'home.feat.level.desc': { es: 'Desde N0 (Humano) hasta N4 (Sintético).', en: 'From N0 (Human) to N4 (Synthetic).' },
    'home.feat.meta': { es: 'Metadatos C2PA', en: 'C2PA Metadata' },
    'home.feat.meta.desc': { es: 'Estándar industrial de autenticidad.', en: 'Industrial standard for authenticity.' },
    'home.feat.credit': { es: 'Créditos de Uso', en: 'Usage Credits' },
    'home.feat.credit.desc': { es: 'Sistema flexible de créditos.', en: 'Flexible credit system.' },
    'footer': { es: 'Proyecto N0N4 • Uso responsable de la IA', en: 'N0N4 Project • Responsible AI usage' },

    // Upload
    'upload.title': { es: 'Proteger Archivo', en: 'Protect File' },
    'upload.desc': { es: 'Sube tu contenido y personaliza tu sello.', en: 'Upload your content and customize your stamp.' },
    'upload.drop': { es: 'Arrastra tu archivo aquí', en: 'Drag your file here' },
    'upload.support': { es: 'Soporta JPG, PNG, PDF', en: 'Supports JPG, PNG, PDF' },
    'upload.preview': { es: 'Vista Previa del Sello', en: 'Stamp Preview' },
    'upload.step1': { es: 'Nivel de IA', en: 'AI Level' },
    'upload.step2': { es: 'Estilo', en: 'Style' },
    'upload.step3': { es: 'Idioma del Sello', en: 'Stamp Language' },
    'upload.btn.protect': { es: 'Proteger Archivo', en: 'Protect File' },
    'upload.btn.download': { es: 'Descargar Protegido', en: 'Download Protected' },
    'upload.btn.other': { es: 'Proteger otro', en: 'Protect another' },
    'upload.processing': { es: 'Procesando...', en: 'Processing...' },
    'upload.done': { es: '¡Protegido!', en: 'Protected!' },

    // Dashboard
    'dash.title': { es: 'Panel de Control', en: 'Dashboard' },
    'dash.subtitle': { es: 'Resumen de tu actividad.', en: 'Activity summary.' },
    'dash.credits': { es: 'Créditos Disponibles', en: 'Available Credits' },
    'dash.protected': { es: 'Archivos Protegidos', en: 'Protected Files' },
    'dash.saved': { es: 'Almacenamiento', en: 'Storage Saved' },
    'dash.quick': { es: 'Acciones Rápidas', en: 'Quick Actions' },
    'dash.new': { es: 'Proteger Nuevo', en: 'Protect New' },
    'dash.lib': { es: 'Ver Librería', en: 'View Library' },

    // Library
    'lib.title': { es: 'Librería', en: 'Library' },
    'lib.subtitle': { es: 'Historial de archivos.', en: 'File history.' },
    'lib.empty': { es: 'No tienes archivos.', en: 'No files yet.' },
    'lib.level': { es: 'Nivel', en: 'Level' },

    // Batch
    'batch.title': { es: 'Procesamiento por Lotes', en: 'Batch Processing' },
    'batch.subtitle': { es: 'Protege múltiples archivos.', en: 'Protect multiple files.' },
    'batch.global': { es: 'Configuración Global', en: 'Global Settings' },
    'batch.btn': { es: 'Procesar Cola', en: 'Process Queue' },
    'batch.add': { es: 'Añadir más', en: 'Add more' },
    'batch.empty': { es: 'La cola está vacía.', en: 'Queue is empty.' },

    // Verify
    'verify.title': { es: 'Verificar Archivo', en: 'Verify File' },
    'verify.desc': { es: 'Comprueba si un archivo tiene sello.', en: 'Check file for stamp.' },
    'verify.drop': { es: 'Sube archivo a verificar', en: 'Upload file to verify' },
    'verify.scanning': { es: 'Escaneando...', en: 'Scanning...' },
    'verify.valid': { es: 'Certificado Válido', en: 'Valid Certificate' },
    'verify.invalid': { es: 'Certificación fallida', en: 'Verification failed' },
    'verify.author': { es: 'Autor', en: 'Author' },
    'verify.date': { es: 'Fecha', en: 'Date' },
    'verify.declared': { es: 'Nivel Declarado', en: 'Declared Level' },

    // Metadata Form (Upload Preview)
    'meta.name': { es: 'Nombre del Archivo', en: 'File Name' },
    'meta.date': { es: 'Fecha de Creación', en: 'Creation Date' },
    'meta.type': { es: 'Tipo de IA', en: 'AI Type' },
    'meta.key': { es: 'Clave C2PA (Simulada)', en: 'C2PA Key (Simulated)' },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('es');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const t = (key: string) => {
        const item = translations[key];
        if (!item) return key;
        return item[language] || item['es'];
    };

    if (!mounted) {
        return (
            <LanguageContext.Provider value={{ language: 'es', setLanguage: () => { }, t }}>
                {children}
            </LanguageContext.Provider>
        );
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export function useCredits() {
    const context = useContext(CreditsContext);
    if (context === undefined) {
        throw new Error('useCredits must be used within a Providers (CreditsProvider)');
    }
    return context;
}


export function Providers({ children }: { children: React.ReactNode }) {
    // Removed ThemeProvider or forced to light mode implicitly by not using it
    // But to be safe and clean, we can leave it wrapping if we force defaultTheme="light" 
    // or just remove it. User asked to "Remove light and dark themes... Leave only light".
    // Best way is to just NOT use next-themes, or configure it to force light.
    // Best way is to just NOT use next-themes, or configure it to force light.
    const [credits, setCredits] = useState(10); // Default start
    const [userDiscount, setUserDiscount] = useState(0); // Default 0%
    const [mounted, setMounted] = useState(false);

    const { user } = useUser();

    // Add effect to sync when user changes
    const fetchCredits = async () => {
        if (!user) return;
        const profile = await getUserProfile();
        if (profile) {
            setCredits(profile.credits);
            setUserDiscount(profile.discount);
        }
    };

    useEffect(() => {
        setMounted(true);
        if (user) fetchCredits();
    }, [user]);

    const refreshCredits = async () => {
        await fetchCredits();
    };

    // We must ALWAYS provide the Context, even during SSR
    // The values will be defaults (10, 0) on server, and updated on client mount
    return (
        <CreditsContext.Provider value={{ credits, refreshCredits, userDiscount }}>
            <LanguageProvider>
                {/* 
                     To act as a "gate" preventing hydration mismatch for content that depends 
                     on the EXACT credit value from localStorage, we could check mounted here. 
                     But for now, letting it hydrate with default (10) then update to (stored) is fine. 
                     Next.js might warn if text differs. `suppressHydrationWarning` on root helps.
                 */}
                {children}
            </LanguageProvider>
        </CreditsContext.Provider>
    );
}
