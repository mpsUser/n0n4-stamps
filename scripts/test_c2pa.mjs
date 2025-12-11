import { createC2pa, ManifestBuilder, createTestSigner } from 'c2pa-node';
import fs from 'fs/promises';
import path from 'path';

// Config
const CERT_PATH = './c2pa_certs/certificate.crt';
const KEY_PATH = './c2pa_certs/private.key';
const INPUT_IMAGE = './public/test.png';
const OUTPUT_IMAGE = './public/signed_test.png';

async function signTest() {
    console.log("🚀 Starting C2PA Signing Test...");

    try {
        // 1. Create Signer using Helper
        const signer = await createTestSigner({
            certificatePath: CERT_PATH,
            privateKeyPath: KEY_PATH
        });

        // 2. Initialize SDK
        console.log("Initializing SDK...");
        const c2pa = await createC2pa({
            signer
        });

        // 3. Read Asset
        console.log(`Reading input image: ${INPUT_IMAGE}`);
        // If sample.jpg doesn't exist, we might fail here. 
        // I'll check directory listing first, but writing the code assuming a file exists 
        // or I will generate a dummy buffer if needed.
        // Let's create a minimal dummy JPEG buffer if file not found? 
        // No, better to try to find a real file or just fail.
        let buffer;
        try {
            buffer = await fs.readFile(INPUT_IMAGE);
        } catch (e) {
            console.warn("⚠️ Sample image not found, creating a simple buffer (might not be valid JPEG but SDK needs buffer)");
            buffer = Buffer.from("fake image data");
            // C2PA SDK likely requires real image structure to embed JUMBF. 
            // I should use a real file.
            console.error("❌ Need a real JPEG file at ./public/sample.jpg");
            return;
        }

        // 4. Create Manifest
        // Using ManifestBuilder as required by SDK
        const manifest = new ManifestBuilder({
            claim_generator: 'N0N4_Test_App/1.0',
            format: 'image/png', // Must match input mimeType
            assertions: [
                {
                    label: 'c2pa.actions',
                    data: {
                        actions: [
                            {
                                action: 'c2pa.created',
                            }
                        ]
                    }
                },
                {
                    label: 'n0n4.test',
                    data: {
                        msg: 'This is a signed test from N0N4'
                    }
                }
            ]
        });

        // 5. Sign
        console.log("Signing...");
        const { signed_asset } = await c2pa.sign({
            asset: {
                buffer,
                mimeType: 'image/png'
            },
            manifest
        });

        // 6. Save
        await fs.writeFile(OUTPUT_IMAGE, signed_asset);
        console.log(`✅ Success! Signed image saved to: ${OUTPUT_IMAGE}`);

    } catch (e) {
        console.error("❌ Signing Failed:", e);
    }
}

signTest();
