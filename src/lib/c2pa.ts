export type NLevel = 0 | 1 | 2 | 3 | 4;
export type StampStyle = 'A' | 'B' | 'C';
// Enforce SVG only
export type StampFormat = 'SVG';
export type StampLanguage = 'es' | 'en';

export interface C2PAMetadata {
    author: string;
    level: NLevel;
    levelLabel: string;
    stampStyle: StampStyle;
    stampFormat: StampFormat;
    stampLanguage: StampLanguage;
    timestamp: string;
    c2pa_key?: string; // Added for persistence
}

export const LEVELS = [
    { level: 0, label_es: 'Sin IA', label_en: 'No AI', description_es: 'Contenido 100% humano.', description_en: '100% human content.', color: 'var(--n0-color)' },
    { level: 1, label_es: 'Guión IA', label_en: 'AI Script', description_es: 'IA usada para ideación o estructura.', description_en: 'AI used for ideation or structure.', color: 'var(--n1-color)' },
    { level: 2, label_es: 'Coautor', label_en: 'Co-author', description_es: 'Colaboración equitativa Humano-IA.', description_en: 'Equal Human-AI collaboration.', color: 'var(--n2-color)' },
    { level: 3, label_es: 'Predominante', label_en: 'Predominant', description_es: 'Mayoría generado por IA.', description_en: 'Mostly AI generated.', color: 'var(--n3-color)' },
    { level: 4, label_es: 'Sintético', label_en: 'Synthetic', description_es: 'Generado 100% por IA.', description_en: '100% AI generated.', color: 'var(--n4-color)' },
];

export function getStampUrl(level: NLevel, style: StampStyle, lang: StampLanguage): string {
    if (lang === 'es') {
        return `/stamps/0 SVG_es/sello_option${style}_N${level}_es.svg`;
    } else {
        return `/stamps/0 SVG_en/option${style}_level${level}.svg`;
    }
}

const MANIFEST_SEPARATOR = "__N0N4_C2PA_MANIFEST__";

export async function protectFile(file: File, meta: C2PAMetadata): Promise<Blob> {
    console.log(`Protecting file ${file.name} with Metadata Injection`);

    return new Promise((resolve) => {
        setTimeout(async () => {
            // 1. Create Manifest String
            const manifestStr = JSON.stringify(meta);

            // 2. Combine Original File + Separator + Manifest
            // This is "Steganography-Lite" - appending data to end of file
            // Most image viewers / PDF readers ignore trailing bytes
            const blobParts = [file, MANIFEST_SEPARATOR, manifestStr];
            const newBlob = new Blob(blobParts, { type: file.type });

            // @ts-ignore - Hack for client-side purely in-memory flows
            newBlob.c2pa_manifest = meta;

            resolve(newBlob);
        }, 1500);
    });
}

export async function verifyC2PA(file: File): Promise<C2PAMetadata | null> {
    try {
        const text = await file.text();
        const parts = text.split(MANIFEST_SEPARATOR);

        if (parts.length > 1) {
            // The last part should be our JSON manifest
            const manifestStr = parts[parts.length - 1];
            try {
                const meta = JSON.parse(manifestStr) as C2PAMetadata;
                return meta;
            } catch (e) {
                console.error("Found separator but failed to parse JSON", e);
                return null;
            }
        }

        // Fallback for "Protected" filenames if no injected data found (Legacy Mock)
        if (file.name.includes("protected")) {
            return {
                author: 'Anonimo (Legacy)',
                level: 2,
                levelLabel: 'Coautor',
                stampStyle: 'A',
                stampFormat: 'SVG',
                stampLanguage: 'es',
                timestamp: new Date().toISOString()
            };
        }

        return null;
    } catch (e) {
        console.error("Verification failed", e);
        return null;
    }
}
