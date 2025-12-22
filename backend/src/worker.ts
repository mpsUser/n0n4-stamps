
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { downloadFile, uploadFile } from './storage';
import { signFileWithC2PA } from './c2pa_sign';
import { provisionCerts } from './certs';


dotenv.config();



// Environment Check
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("FATAL: Missing Supabase Credentials");
    console.error("Checked: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Provision Certs Once
let CERT_PATHS: { certPath: string; keyPath: string } | null = null;

async function processJob(job: any) {
    console.log(`[Job ${job.id}] Picking up...`);

    // Ack
    await supabase.from('jobs').update({ status: 'PROCESSING' }).eq('id', job.id);

    // Temp Paths
    const filename = path.basename(job.input_path);
    const localInput = path.join('/tmp', `in_${job.id}_${filename}`);
    const localOutput = path.join('/tmp', `out_${job.id}_${filename}`);

    try {
        if (!CERT_PATHS) {
            throw new Error("Certificates not available");
        }

        // 1. Download from R2
        console.log(`[Job ${job.id}] Downloading ${job.input_path}...`);
        await downloadFile(job.input_path, localInput);

        // 2. Sign
        console.log(`[Job ${job.id}] Signing...`);
        // Basic metadata for now
        const metadata = {
            author: job.user_email,
            timestamp: new Date().toISOString(),
            jobId: job.id
        };

        await signFileWithC2PA({
            inputPath: localInput,
            outputPath: localOutput,
            certPath: CERT_PATHS.certPath,
            keyPath: CERT_PATHS.keyPath,
            metadata
        });

        // 3. Upload to R2 (Signed)
        const outputKey = `signed/${path.basename(localOutput)}`;
        const contentType = 'image/jpeg'; // TODO: Detect or pass from job

        console.log(`[Job ${job.id}] Uploading result to ${outputKey}...`);
        await uploadFile(outputKey, localOutput, contentType);

        // 4. Complete
        const completionUpdates: any = {
            status: 'COMPLETED',
            output_path: outputKey,
            completed_at: new Date().toISOString()
        };

        await supabase.from('jobs').update(completionUpdates).eq('id', job.id);

        console.log(`[Job ${job.id}] Success!`);

    } catch (err: any) {
        console.error(`[Job ${job.id}] Failed:`, err);
        await supabase.from('jobs').update({
            status: 'FAILED',
            error: err.message
        }).eq('id', job.id);
    } finally {
        // Cleanup
        await fs.unlink(localInput).catch(() => { });
        await fs.unlink(localOutput).catch(() => { });
    }
}

async function processPendingJobs() {
    console.log("Checking for pending jobs...");

    CERT_PATHS = await provisionCerts();
    if (!CERT_PATHS) {
        console.error("❌ Certificates not provisioned. Cannot process jobs.");
        return 0; // Return 0 processed instead of exit
    }

    // Single pass to process pending jobs
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'PENDING')
        .limit(5); // Process up to 5 at a time

    if (jobs && jobs.length > 0) {
        console.log(`[Worker] Found ${jobs.length} pending jobs.`);
        for (const job of jobs) {
            await processJob(job);
        }
        return jobs.length;
    }
    return 0;
}

// Cloud Run Server
import http from 'http';

const PORT = process.env.PORT || 8080;

const server = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
    if ((req.method === 'POST' || req.url === '/trigger') && req.url !== '/favicon.ico') {
        try {
            if (!CERT_PATHS) {
                // Ensure certs are ready
                console.log("⚠️ Certs not ready, provisioning...");
                CERT_PATHS = await provisionCerts();
            }

            console.log("⚡️ Trigger received. Checking for jobs...");
            const processedCount = await processPendingJobs();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', processed: processedCount }));
        } catch (err: any) {
            console.error("Error in trigger:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
        }
    } else {
        // Health check / Root
        res.writeHead(200);
        res.end('Worker is running. POST to / to trigger processing.');
    }
});

async function init() {
    console.log("🚀 Worker starting...");
    try {
        // Debug: Check c2patool version
        const { exec } = require('child_process');
        exec('c2patool --version', (err: any, stdout: any, stderr: any) => {
            console.log(`[DEBUG] c2patool version: ${stdout || stderr || err}`);
        });

        CERT_PATHS = await provisionCerts();
        console.log("✅ Certs initialized.");
        console.log("Staring initial job check...");
        await processPendingJobs();
    } catch (e) {
        console.error("❌ Failed to init certs:", e);
    }

    server.listen(PORT, () => {
        console.log(`🌍 Cloud Run Worker listening on port ${PORT}`);
    });
}

init();
