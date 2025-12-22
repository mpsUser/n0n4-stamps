"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const storage_1 = require("./storage");
const c2pa_sign_1 = require("./c2pa_sign");
const certs_1 = require("./certs");
dotenv_1.default.config();
// Environment Check
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("FATAL: Missing Supabase Credentials");
    console.error("Checked: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}
const supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_KEY);
// Provision Certs Once
let CERT_PATHS = null;
async function processJob(job) {
    console.log(`[Job ${job.id}] Picking up...`);
    // Ack
    await supabase.from('jobs').update({ status: 'PROCESSING' }).eq('id', job.id);
    // Temp Paths
    const filename = path_1.default.basename(job.input_path);
    const localInput = path_1.default.join('/tmp', `in_${job.id}_${filename}`);
    const localOutput = path_1.default.join('/tmp', `out_${job.id}_${filename}`);
    try {
        if (!CERT_PATHS) {
            throw new Error("Certificates not available");
        }
        // 1. Download from R2
        console.log(`[Job ${job.id}] Downloading ${job.input_path}...`);
        await (0, storage_1.downloadFile)(job.input_path, localInput);
        // 2. Sign
        console.log(`[Job ${job.id}] Signing...`);
        // Basic metadata for now
        const metadata = {
            author: job.user_email,
            timestamp: new Date().toISOString(),
            jobId: job.id
        };
        await (0, c2pa_sign_1.signFileWithC2PA)({
            inputPath: localInput,
            outputPath: localOutput,
            certPath: CERT_PATHS.certPath,
            keyPath: CERT_PATHS.keyPath,
            metadata
        });
        // 3. Upload to R2 (Signed)
        const outputKey = `signed/${path_1.default.basename(localOutput)}`;
        const contentType = 'image/jpeg'; // TODO: Detect or pass from job
        console.log(`[Job ${job.id}] Uploading result to ${outputKey}...`);
        await (0, storage_1.uploadFile)(outputKey, localOutput, contentType);
        // 4. Complete
        await supabase.from('jobs').update({
            status: 'COMPLETED',
            output_path: outputKey,
            completed_at: new Date().toISOString()
        }).eq('id', job.id);
        console.log(`[Job ${job.id}] Success!`);
    }
    catch (err) {
        console.error(`[Job ${job.id}] Failed:`, err);
        await supabase.from('jobs').update({
            status: 'FAILED',
            error: err.message
        }).eq('id', job.id);
    }
    finally {
        // Cleanup
        await promises_1.default.unlink(localInput).catch(() => { });
        await promises_1.default.unlink(localOutput).catch(() => { });
    }
}
async function processPendingJobs() {
    console.log("Checking for pending jobs...");
    CERT_PATHS = await (0, certs_1.provisionCerts)();
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
const http_1 = __importDefault(require("http"));
const PORT = process.env.PORT || 8080;
const server = http_1.default.createServer(async (req, res) => {
    if ((req.method === 'POST' || req.url === '/trigger') && req.url !== '/favicon.ico') {
        try {
            if (!CERT_PATHS) {
                // Ensure certs are ready
                console.log("⚠️ Certs not ready, provisioning...");
                CERT_PATHS = await (0, certs_1.provisionCerts)();
            }
            console.log("⚡️ Trigger received. Checking for jobs...");
            const processedCount = await processPendingJobs();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', processed: processedCount }));
        }
        catch (err) {
            console.error("Error in trigger:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
        }
    }
    else {
        // Health check / Root
        res.writeHead(200);
        res.end('Worker is running. POST to / to trigger processing.');
    }
});
async function init() {
    console.log("🚀 Worker starting...");
    try {
        CERT_PATHS = await (0, certs_1.provisionCerts)();
        console.log("✅ Certs initialized.");
        console.log("Staring initial job check...");
        await processPendingJobs();
    }
    catch (e) {
        console.error("❌ Failed to init certs:", e);
    }
    server.listen(PORT, () => {
        console.log(`🌍 Cloud Run Worker listening on port ${PORT}`);
    });
}
init();
