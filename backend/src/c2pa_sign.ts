
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs/promises';

const execPromise = util.promisify(exec);

interface SignOptions {
    inputPath: string;
    outputPath: string;
    certPath: string;
    keyPath: string;
    metadata: any;
}

export async function signFileWithC2PA({ inputPath, outputPath, certPath, keyPath, metadata }: SignOptions) {
    console.log(`[C2PA] Signing ${inputPath} -> ${outputPath}`);

    // Create a temporary manifest file
    const manifestPath = path.join('/tmp', `manifest_${Date.now()}.json`);
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

    await fs.writeFile(manifestPath, JSON.stringify(manifest));

    try {
        // Construct c2patool command
        // c2patool file.jpg -m manifest.json -o signed.jpg -c cert.pem -k key.pem
        const cmd = `c2patool "${inputPath}" -m "${manifestPath}" -o "${outputPath}" -c "${certPath}" -k "${keyPath}" --force`;

        console.log(`[C2PA] Reguired Command: ${cmd}`);
        const { stdout, stderr } = await execPromise(cmd);

        console.log(`[C2PA] Output: ${stdout}`);
        if (stderr) console.error(`[C2PA] Stderr: ${stderr}`);

        return { success: true };
    } catch (error: any) {
        // Detect "command not found" for local dev fallback
        if (error.message.includes("c2patool: command not found") || error.code === 127) {
            console.warn("\n[WARN] 'c2patool' not found. We are likely in Local Dev without Rust installed.");
            console.warn("[WARN] SIMULATING SIGNING by copying input to output.");
            console.warn("[WARN] This is acceptable for verifying Architecture/Queue flow.\n");

            await fs.copyFile(inputPath, outputPath);
            return { success: true, simulated: true };
        }

        console.error('[C2PA] Signing Failed:', error.message);
        throw error;
    } finally {
        // Cleanup manifest
        await fs.unlink(manifestPath).catch(() => { });
    }
}
