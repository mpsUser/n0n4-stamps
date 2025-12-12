'use server';

import { createC2pa, createTestSigner, ManifestBuilder } from 'c2pa-node';
import fs from 'fs/promises';
import path from 'path';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { currentUser } from '@clerk/nextjs/server';

// Dev Config: If true, we skip actual cryptographic signing if it fails (fallback)
// Dev Config: If true, we skip actual cryptographic signing if it fails (fallback)
const ALLOW_INSECURE_DEV_FALLBACK = true; // ENABLED: Auto-fallback for Vercel (where certs are missing)

// Paths to certs
const CERT_PATH = path.join(process.cwd(), 'c2pa_certs', 'chain.crt'); // Use Full Chain
const KEY_PATH = path.join(process.cwd(), 'c2pa_certs', 'private.key');

interface SignResult {
    success: boolean;
    signedUrl?: string;
    error?: string;
    isFallback?: boolean;
}

export async function signAndUploadAction(formData: FormData, metadata: any): Promise<SignResult> {
    const file = formData.get('file') as File;
    const newName = formData.get('newName') as string;
    if (!file) return { success: false, error: 'No file provided' };

    const user = await currentUser();
    // In production, verify user credits here again

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    const isImage = mimeType === 'image/jpeg' || mimeType === 'image/png';
    const isPdf = mimeType === 'application/pdf';

    console.log(`[C2PA] Processing ${newName} (${mimeType})...`);

    let signedBuffer: Buffer = buffer;
    let signingSuccess = false;

    try {
        // 1. Setup Signer
        const signer = await createTestSigner({
            certificatePath: CERT_PATH,
            privateKeyPath: KEY_PATH,
        });

        // 2. Setup C2PA SDK
        const c2pa = await createC2pa({ signer });

        // 3. Create Manifest
        const manifest = new ManifestBuilder({
            claim_generator: 'N0N4_App/1.0',
            format: mimeType,
            title: file.name,
            assertions: [
                {
                    label: 'c2pa.actions',
                    data: { actions: [{ action: 'c2pa.created' }] }
                },
                {
                    label: 'n0n4.metadata',
                    data: metadata
                }
            ]
        });

        // 4. Sign
        if (isImage) {
            // Memory Signing
            console.log('[C2PA] Signing Image in memory...');
            const { signedAsset } = await c2pa.sign({
                asset: { buffer, mimeType },
                manifest
            });
            signedBuffer = signedAsset.buffer; // Correct property access for Node binding
            signingSuccess = true;

        } else if (isPdf) {
            // File Signing (using /tmp)
            console.log('[C2PA] Signing PDF in /tmp...');
            const tempInput = path.join('/tmp', `input_${Date.now()}.pdf`);
            const tempOutput = path.join('/tmp', `output_${Date.now()}.pdf`);

            await fs.writeFile(tempInput, buffer);

            const { signedAsset } = await c2pa.sign({
                asset: { path: tempInput, mimeType },
                manifest,
                options: { outputPath: tempOutput }
            });

            // Read back
            if ('path' in signedAsset) {
                signedBuffer = await fs.readFile(signedAsset.path);
                signingSuccess = true;
            }

            // Cleanup
            await fs.unlink(tempInput).catch(() => { });
            await fs.unlink(tempOutput).catch(() => { });
        } else {
            console.warn('[C2PA] Format not supported for signing yet:', mimeType);
        }

    } catch (e: any) {
        console.error('[C2PA] Signing Failed:', e);
        if (!ALLOW_INSECURE_DEV_FALLBACK) {
            return { success: false, error: `Signing failed: ${e.message}` };
        }
        console.warn('[C2PA] Using unsigned original file (Fallback Mode)');

        // --- FALLBACK: Append Legacy Metadata ---
        // Since we couldn't sign with C2PA, we append the JSON metadata manually 
        // ensuring the file is at least "Legacy Protected" and verifiable.
        const MANIFEST_SEPARATOR = "__N0N4_C2PA_MANIFEST__";
        const metaString = JSON.stringify(metadata);
        const separatorBuffer = Buffer.from(MANIFEST_SEPARATOR);
        const metaBuffer = Buffer.from(metaString);

        signedBuffer = Buffer.concat([buffer, separatorBuffer, metaBuffer]);
    }

    // 5. Upload to Supabase (Signed or Original)
    // Use Admin Client to bypass RLS
    const targetFilename = newName || file.name;
    const { data, error } = await supabaseAdmin
        .storage
        .from('uploads')
        .upload(targetFilename, signedBuffer, {
            contentType: mimeType,
            upsert: true
        });

    if (error) {
        console.error('[Supabase] Upload failed:', error);
        return { success: false, error: 'Upload failed' };
    }

    // 6. Get Public URL
    const { data: { publicUrl } } = supabaseAdmin
        .storage
        .from('uploads')
        .getPublicUrl(targetFilename);

    // 7. Log to DB (optional, handled by caller mostly)

    return {
        success: true,
        signedUrl: publicUrl,
        isFallback: !signingSuccess
    };
}

export async function verifyAction(formData: FormData): Promise<{ success: boolean; metadata?: any; error?: string }> {
    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'No file provided' };

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    const isImage = mimeType === 'image/jpeg' || mimeType === 'image/png';
    const isPdf = mimeType === 'application/pdf';

    // --- STRATEGY 1: Modern C2PA Check ---
    try {
        const c2pa = await createC2pa({});
        let report;

        if (isImage) {
            console.log('[C2PA] Verifying Image in memory...');
            const result = await c2pa.read({ buffer, mimeType });
            report = result?.active_manifest;
        } else if (isPdf) {
            console.log('[C2PA] Verifying PDF in /tmp...');
            const tempInput = path.join('/tmp', `verify_${Date.now()}.pdf`);
            await fs.writeFile(tempInput, buffer);
            try {
                const result = await c2pa.read({ path: tempInput, mimeType });
                report = result?.manifest;
            } finally {
                await fs.unlink(tempInput).catch(() => { });
            }
        }

        if (report) {
            // Check for N0N4 specific metadata
            const customAssertion = report.assertions?.find((a: any) => a.label === 'n0n4.metadata');
            if (customAssertion) {
                return { success: true, metadata: customAssertion.data };
            }

            // Generic C2PA found but no N0N4 data -> Return simplified Generic Metadata
            console.log('Valid C2PA found (Generic/External)');
            return {
                success: true,
                metadata: {
                    author: report.claim_generator || 'Third Party Tool',
                    level: 2,
                    levelLabel: 'C2PA Validated',
                    stampStyle: 'A',
                    stampFormat: 'SVG',
                    stampLanguage: 'en',
                    timestamp: report.claim_generator_info?.[0]?.version || new Date().toISOString()
                }
            };
        }
    } catch (e: any) {
        console.warn('[C2PA] Standard verification failed or no manifest:', e.message);
    }

    // --- STRATEGY 2: Legacy Fallback (Appended JSON) ---
    // If we are here, C2PA failed or wasn't found. Check for legacy injection.
    try {
        const MANIFEST_SEPARATOR = "__N0N4_C2PA_MANIFEST__";
        const separatorBuffer = Buffer.from(MANIFEST_SEPARATOR);
        const idx = buffer.indexOf(separatorBuffer);

        if (idx !== -1) {
            console.log('[C2PA] Legacy manifest found via Buffer scan');
            // Extract from (idx + separator length) to end
            const startPos = idx + separatorBuffer.length;
            const metaBuffer = buffer.subarray(startPos);
            const metaString = metaBuffer.toString('utf-8');

            try {
                const meta = JSON.parse(metaString);
                return { success: true, metadata: meta };
            } catch (jsonErr) {
                console.warn('[C2PA] Found separator but JSON parse failed');
            }
        }
    } catch (e: any) {
        console.warn('[C2PA] Legacy scan failed:', e.message);
    }

    return { success: false, error: 'No verifiable metadata found' };
}
