/**
 * AES-256-GCM admin session cookie using Web Crypto (works in Node 18+ and Edge middleware).
 * ADMIN_SESSION_SECRET: 64-char hex = 32 bytes, or any string padded/truncated to 32 bytes.
 */

function getAdminSessionKeyBytes(secret: string): Uint8Array {
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set — cannot issue admin sessions");
  if (secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)) {
    const out = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      out[i] = parseInt(secret.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
  }
  const enc = new TextEncoder().encode(secret);
  const out = new Uint8Array(32);
  out.set(enc.slice(0, Math.min(32, enc.length)));
  return out;
}

function base64UrlEncode(data: Uint8Array): string {
  const b64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(data).toString("base64")
      : (() => {
          let bin = "";
          for (let i = 0; i < data.length; i++) bin += String.fromCharCode(data[i]!);
          return btoa(bin);
        })();
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(s: string): Uint8Array {
  let b = s.replace(/-/g, "+").replace(/_/g, "/");
  while (b.length % 4) b += "=";
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b, "base64"));
  }
  const bin = atob(b);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encryptAdminSessionPayload(payload: string, secret: string): Promise<string> {
  const keyBytes = getAdminSessionKeyBytes(secret);
  const keyMaterial = new Uint8Array(keyBytes);
  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial as unknown as BufferSource,
    "AES-GCM",
    false,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as unknown as BufferSource, tagLength: 128 },
      key,
      new TextEncoder().encode(payload),
    ),
  );
  const combined = new Uint8Array(12 + ciphertext.length);
  combined.set(iv, 0);
  combined.set(ciphertext, 12);
  return base64UrlEncode(combined);
}

export type AdminSessionPayload = {
  email: string;
  role: "admin" | "super_admin";
  iat: number;
};

export async function decryptAdminSessionToken(
  token: string,
  secret: string,
): Promise<AdminSessionPayload | null> {
  try {
    const raw = base64UrlDecode(token);
    if (raw.length < 12 + 16) return null;
    const iv = raw.slice(0, 12);
    const ciphertext = raw.slice(12);
    const keyBytes = getAdminSessionKeyBytes(secret);
    const keyMaterial = new Uint8Array(keyBytes);
    const key = await crypto.subtle.importKey(
      "raw",
      keyMaterial as unknown as BufferSource,
      "AES-GCM",
      false,
      ["decrypt"],
    );
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as unknown as BufferSource, tagLength: 128 },
      key,
      ciphertext as unknown as BufferSource,
    );
    const text = new TextDecoder().decode(plain);
    const payload = JSON.parse(text) as Partial<AdminSessionPayload>;
    if (!payload.email || !payload.role || typeof payload.iat !== "number") return null;
    if (payload.role !== "admin" && payload.role !== "super_admin") return null;
    if (Date.now() - payload.iat > 8 * 60 * 60 * 1000) return null;
    return {
      email: payload.email,
      role: payload.role,
      iat: payload.iat,
    };
  } catch {
    return null;
  }
}
