
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
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

export const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

export const BUCKET_NAME = R2_BUCKET_NAME;

export async function downloadFile(key: string, localPath: string): Promise<void> {
    const fs = require('fs');
    const { Body } = await s3Client.send(new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
    }));

    // Save stream to file
    return new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(localPath);
        (Body as any).pipe(stream);
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}

export async function uploadFile(key: string, localPath: string, contentType: string): Promise<void> {
    const fs = require('fs');
    const fileContent = fs.readFileSync(localPath);

    await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: contentType
    }));
}
