"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signFileWithC2PA = signFileWithC2PA;
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const execPromise = util_1.default.promisify(child_process_1.exec);
async function signFileWithC2PA({ inputPath, outputPath, certPath, keyPath, metadata }) {
    console.log(`[C2PA] Signing ${inputPath} -> ${outputPath}`);
    // Create a temporary manifest file
    const manifestPath = path_1.default.join('/tmp', `manifest_${Date.now()}.json`);
    const manifest = {
        "claim_generator": "N0N4_Stamp/1.0",
        "assertions": [
            {
                "label": "c2pa.actions",
                "data": {
                    "actions": [
                        {
                            "action": "c2pa.created"
                        }
                    ]
                }
            },
            {
                "label": "n0n4.metadata",
                "data": metadata
            }
        ]
    };
    await promises_1.default.writeFile(manifestPath, JSON.stringify(manifest));
    try {
        // Construct c2patool command
        // c2patool file.jpg -m manifest.json -o signed.jpg -c cert.pem -k key.pem
        const cmd = `c2patool "${inputPath}" -m "${manifestPath}" -o "${outputPath}" -c "${certPath}" -k "${keyPath}" --force`;
        console.log(`[C2PA] Reguired Command: ${cmd}`);
        const { stdout, stderr } = await execPromise(cmd);
        console.log(`[C2PA] Output: ${stdout}`);
        if (stderr)
            console.error(`[C2PA] Stderr: ${stderr}`);
        return { success: true };
    }
    catch (error) {
        // Detect "command not found" for local dev fallback
        if (error.message.includes("c2patool: command not found") || error.code === 127) {
            console.warn("\n[WARN] 'c2patool' not found. We are likely in Local Dev without Rust installed.");
            console.warn("[WARN] SIMULATING SIGNING by copying input to output.");
            console.warn("[WARN] This is acceptable for verifying Architecture/Queue flow.\n");
            await promises_1.default.copyFile(inputPath, outputPath);
            return { success: true, simulated: true };
        }
        console.error('[C2PA] Signing Failed:', error.message);
        throw error;
    }
    finally {
        // Cleanup manifest
        await promises_1.default.unlink(manifestPath).catch(() => { });
    }
}
