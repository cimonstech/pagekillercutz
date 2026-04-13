import { uploadToR2 } from "@/lib/r2";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof Blob)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: "Invalid file type. Use JPG, PNG, or WebP." }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "File too large. Max 10MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const key = `music-covers/cover_${timestamp}_${random}.${safeExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const url = await uploadToR2(buffer, key, file.type || `image/${safeExt === "jpg" ? "jpeg" : safeExt}`);
    if (!url.startsWith("https://") && !url.startsWith("http://")) {
      console.error("[upload/music-cover] Generated URL is not absolute:", url);
      return Response.json(
        { error: "Invalid URL generated. Check R2_PUBLIC_URL in .env.local" },
        { status: 500 },
      );
    }
    console.log("[upload/music-cover] Success:", url);
    logger.infoRaw("upload/music-cover", "[upload/music-cover] Uploaded:", url);

    return Response.json({ success: true, url });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Upload failed");
    console.error(
      "[upload/music-cover]",
      JSON.stringify({
        name: error.name,
        message: error.message,
        bucket: process.env.R2_BUCKET_NAME,
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID ? "set" : "MISSING",
        accessKey: process.env.R2_ACCESS_KEY_ID ? "set" : "MISSING",
        secretKey: process.env.R2_SECRET_ACCESS_KEY ? "set" : "MISSING",
      }),
    );
    logger.errorRaw("upload/music-cover", "[upload/music-cover]", error);
    return Response.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
