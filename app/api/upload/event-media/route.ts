import { uploadToR2 } from "@/lib/r2";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import { validateImageBytes, validateIsobmffVideoBytes } from "@/lib/validateFileBytes";

const MAX_BYTES = 50 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof Blob)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/quicktime",
    ];
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: "Invalid file type. Use JPG, PNG, WebP, MP4, or MOV." },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return Response.json({ error: "File too large. Max 50MB per file." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const key = `event-media/${stamp}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const isImageMime = file.type.startsWith("image/");
    if (isImageMime) {
      if (!validateImageBytes(buffer)) {
        return Response.json(
          { error: "Invalid file. Upload a real JPG, PNG or WebP image." },
          { status: 400 },
        );
      }
    } else if (!validateIsobmffVideoBytes(buffer)) {
      return Response.json(
        { error: "Invalid file. Upload a real MP4 or MOV video." },
        { status: 400 },
      );
    }

    const url = await uploadToR2(buffer, key, file.type || "application/octet-stream");
    if (!url.startsWith("https://") && !url.startsWith("http://")) {
      logger.error("upload/event-media", "Generated URL is not absolute", url);
      return Response.json(
        { error: "Invalid URL generated. Check R2_PUBLIC_URL in .env.local" },
        { status: 500 },
      );
    }
    logger.infoRaw("upload/event-media", "[upload/event-media] Uploaded:", url);

    return Response.json({ success: true, url });
  } catch (err) {
    logger.errorRaw("upload/event-media", "[upload/event-media]", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
