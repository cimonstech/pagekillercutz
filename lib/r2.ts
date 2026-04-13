import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 (S3-compatible). Set in `.env.local`:
 * - CLOUDFLARE_ACCOUNT_ID (or R2_ACCOUNT_ID)
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME
 * - R2_PUBLIC_URL (public bucket URL, no trailing slash), e.g. https://assets.pagekillercutz.com
 */

export const R2_BUCKET = process.env.R2_BUCKET_NAME || "pagekillercutz";
export const R2_PUBLIC_URL = (() => {
  const url = process.env.R2_PUBLIC_URL || "https://assets.pagekillercutz.com";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url.replace(/\/$/, "");
  }
  return `https://${url}`.replace(/\/$/, "");
})();

export function getR2Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;

  if (!accountId) throw new Error("CLOUDFLARE_ACCOUNT_ID not set in .env.local");
  if (!accessKeyId) throw new Error("R2_ACCESS_KEY_ID not set in .env.local");
  if (!secretAccessKey) throw new Error("R2_SECRET_ACCESS_KEY not set in .env.local");
  if (!bucket) throw new Error("R2_BUCKET_NAME not set in .env.local");

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function uploadToR2(file: Buffer, key: string, contentType: string): Promise<string> {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME!;

  console.log(`[r2] Uploading to bucket: "${bucket}" key: "${key}"`);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    }),
  );
  const url = `${R2_PUBLIC_URL}/${key}`;
  console.log(`[r2] Upload complete: ${url}`);
  return url;
}
