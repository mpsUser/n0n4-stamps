"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.provisionCerts = provisionCerts;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
async function provisionCerts() {
    const certEnv = process.env.C2PA_CERTIFICATE;
    const keyEnv = process.env.C2PA_PRIVATE_KEY;
    // Fixed Paths
    const certDir = path_1.default.join(process.cwd(), 'certs');
    const certPath = path_1.default.join(certDir, 'cert.pem');
    const keyPath = path_1.default.join(certDir, 'key.pem');
    // Ensure dir exists
    await promises_1.default.mkdir(certDir, { recursive: true });
    if (!certEnv || !keyEnv) {
        console.warn("[Certs] Missing C2PA_CERTIFICATE or C2PA_PRIVATE_KEY env vars.");
        console.log("[Certs] Generating temporary self-signed C2PA certificates for testing...");
        // Use openssl to generate self-signed cert
        // 1. Generate Key
        // 2. Generate Cert
        // Since we have installed openssl/c2patool via apt in Docker, we might have it locally too?
        // Actually, for local testing without docker, we assume the user has openssl.
        try {
            const { exec } = require('child_process');
            const util = require('util');
            const execPromise = util.promisify(exec);
            // Generate Key
            await execPromise(`openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=TestSigner"`);
            console.log("[Certs] Temporary certs generated successfully.");
            return { certPath, keyPath };
        }
        catch (e) {
            console.error("Failed to auto-generate certs:", e.message);
            return null;
        }
    }
    console.log("[Certs] Provisioning certificates to disk...");
    // Cloud Run env vars might have escaped newlines
    const cleanCert = certEnv.replace(/\\n/g, '\n');
    const cleanKey = keyEnv.replace(/\\n/g, '\n');
    await promises_1.default.writeFile(certPath, cleanCert);
    await promises_1.default.writeFile(keyPath, cleanKey);
    return { certPath, keyPath };
}
