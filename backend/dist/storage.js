"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUCKET_NAME = exports.s3Client = void 0;
exports.downloadFile = downloadFile;
exports.uploadFile = uploadFile;
const client_s3_1 = require("@aws-sdk/client-s3");
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner'; 
// Presigned URLs usually generated on frontend/API, but good to have if needed.
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID?.trim();
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID?.trim();
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY?.trim();
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME?.trim();
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.error("FATAL: Missing R2 Credentials");
    process.exit(1);
}
exports.s3Client = new client_s3_1.S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});
exports.BUCKET_NAME = R2_BUCKET_NAME;
async function downloadFile(key, localPath) {
    const fs = require('fs');
    const { Body } = await exports.s3Client.send(new client_s3_1.GetObjectCommand({
        Bucket: exports.BUCKET_NAME,
        Key: key
    }));
    // Save stream to file
    return new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(localPath);
        Body.pipe(stream);
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}
async function uploadFile(key, localPath, contentType) {
    const fs = require('fs');
    const fileContent = fs.readFileSync(localPath);
    await exports.s3Client.send(new client_s3_1.PutObjectCommand({
        Bucket: exports.BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: contentType
    }));
}
