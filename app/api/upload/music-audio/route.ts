import { uploadToR2 } from "@/lib/r2";
import { logger } from "@/lib/logger";
import { parseBuffer } from "music-metadata";

const MAX_BYTES = 200 * 1024 * 1024;
const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof Blob)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/flac", "audio/mp4", "audio/x-m4a", "audio/x-wav"];
    const type = file.type || "";
    if (!allowedTypes.includes(type) && !file.name.match(/\.(mp3|wav|flac|m4a)$/i)) {
      return Response.json({ error: "Invalid file type. Use MP3, WAV, FLAC, or M4A." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return Response.json({ error: "File too large. Max 200MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
    const safeExt = ["mp3", "wav", "flac", "m4a"].includes(ext) ? ext : "mp3";
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const key = `music-audio/audio_${timestamp}_${random}.${safeExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let durationSeconds: number | null = null;
    try {
      const metadata = await parseBuffer(buffer, { mimeType: file.type });
      durationSeconds = metadata.format.duration ? Math.round(metadata.format.duration) : null;
    } catch (err) {
      console.warn("[upload/music-audio] Could not detect duration:", err);
    }

    const contentType = type
      ? type
      : safeExt === "mp3"
        ? "audio/mpeg"
        : safeExt === "wav"
          ? "audio/wav"
          : safeExt === "m4a"
            ? "audio/mp4"
            : "audio/flac";
    const url = await uploadToR2(buffer, key, contentType);
    if (!url.startsWith("https://") && !url.startsWith("http://")) {
      console.error("[upload/music-audio] Generated URL is not absolute:", url);
      return Response.json(
        { error: "Invalid URL generated. Check R2_PUBLIC_URL in .env.local" },
        { status: 500 },
      );
    }
    console.log("[upload/music-audio] Success:", url);
    logger.infoRaw("upload/music-audio", "[upload/music-audio] Uploaded:", url);

    return Response.json({
      success: true,
      url,
      duration: durationSeconds,
      durationFormatted: durationSeconds ? formatDuration(durationSeconds) : null,
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Upload failed");
    console.error(
      "[upload/music-audio]",
      JSON.stringify({
        name: error.name,
        message: error.message,
        bucket: process.env.R2_BUCKET_NAME,
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID ? "set" : "MISSING",
        accessKey: process.env.R2_ACCESS_KEY_ID ? "set" : "MISSING",
        secretKey: process.env.R2_SECRET_ACCESS_KEY ? "set" : "MISSING",
      }),
    );
    logger.errorRaw("upload/music-audio", "[upload/music-audio]", error);
    return Response.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
