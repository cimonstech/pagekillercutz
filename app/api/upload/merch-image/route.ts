import { uploadToR2 } from "@/lib/r2";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const productId = (formData.get("productId") as string | null)?.trim() || "";

    if (!file || !(file instanceof Blob)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: "Invalid file type. Use JPG, PNG, or WebP." },
        { status: 400 },
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: "File too large. Max 5MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const prefix = productId ? `${productId}-${stamp}` : stamp;
    const key = `merch-images/${prefix}.${safeExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const url = await uploadToR2(buffer, key, file.type || `image/${safeExt === "jpg" ? "jpeg" : safeExt}`);
    if (!url.startsWith("https://") && !url.startsWith("http://")) {
      console.error("[upload/merch-image] Generated URL is not absolute:", url);
      return Response.json(
        { error: "Invalid URL generated. Check R2_PUBLIC_URL in .env.local" },
        { status: 500 },
      );
    }
    console.log("[upload/merch-image] Success:", url);
    logger.infoRaw("upload/merch-image", "[upload/merch-image] Uploaded:", url);

    return Response.json({ success: true, url });
  } catch (err) {
    logger.errorRaw("upload/merch-image", "[upload/merch-image]", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
