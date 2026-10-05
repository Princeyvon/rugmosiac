/**
 * Security & Malware Defense Module for Mosiac Studio
 *
 * Implements strict OWASP file upload defense:
 * 1. Magic bytes signature verification (rejects polyglot / spoofed files).
 * 2. Deep heuristic scanning for shellcode, embedded scripts, backdoors, and exploit vectors.
 * 3. Size boundaries to prevent heap/disk denial of service.
 * 4. Strict filename sanitization and path traversal prevention.
 * 5. Secure HTTP headers for media streaming and trusted downloads.
 */
import path from "node:path";

export interface FileSignature {
  mimeType: string;
  extension: string;
  category: "image" | "pdf";
}

/**
 * Detects real file format from binary header magic bytes.
 * Returns null if the file signature does not match any allowed format.
 */
export function detectFileSignature(buffer: Buffer): FileSignature | null {
  if (!buffer || buffer.length < 4) return null;

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: "image/jpeg", extension: "jpg", category: "image" };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mimeType: "image/png", extension: "png", category: "image" };
  }

  // 3. WebP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mimeType: "image/webp", extension: "webp", category: "image" };
  }

  // 4. GIF: GIF87a or GIF89a (47 49 46 38 37 61 / 47 49 46 38 39 61)
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return { mimeType: "image/gif", extension: "gif", category: "image" };
  }

  // 5. PDF: %PDF- (25 50 44 46 2D)
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { mimeType: "application/pdf", extension: "pdf", category: "pdf" };
  }

  return null;
}

/**
 * Scans a file buffer for embedded malware, script vectors, shellcode, and backdoors.
 */
export function scanBufferForThreats(
  buffer: Buffer,
  category: "image" | "pdf"
): { safe: boolean; reason?: string } {
  if (!buffer || buffer.length === 0) {
    return { safe: false, reason: "Empty file payload" };
  }

  // 1. Detect executable binary headers
  // Windows PE / DLL (MZ)
  if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return { safe: false, reason: "Executable Windows binary (MZ header) detected" };
  }
  // Linux ELF binary (7F 45 4C 46)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x7f &&
    buffer[1] === 0x45 &&
    buffer[2] === 0x4c &&
    buffer[3] === 0x46
  ) {
    return { safe: false, reason: "Executable Linux binary (ELF header) detected" };
  }
  // Java class file (CA FE BA BE)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0xca &&
    buffer[1] === 0xfe &&
    buffer[2] === 0xba &&
    buffer[3] === 0xbe
  ) {
    return { safe: false, reason: "Java compiled binary detected" };
  }
  // Unix shell script shebang (#! /bin/...)
  if (buffer.length >= 2 && buffer[0] === 0x23 && buffer[1] === 0x21) {
    return { safe: false, reason: "Executable script file detected" };
  }

  // 2. Scan for embedded script injection, web shell signatures, and HTML polyglots
  // Read both beginning (header) and end (trailer/metadata) where polyglots hide
  const headChunk = buffer.subarray(0, Math.min(buffer.length, 64 * 1024)).toString("binary");
  const tailChunk =
    buffer.length > 64 * 1024
      ? buffer.subarray(buffer.length - 64 * 1024).toString("binary")
      : "";
  const combinedSample = `${headChunk} ${tailChunk}`.toLowerCase();

  const dangerousPatterns = [
    "<script",
    "javascript:",
    "vbscript:",
    "<?php",
    "<%@",
    "base64_decode(",
    "eval(",
    "passthru(",
    "shell_exec(",
    "system(",
    "proc_open(",
    "document.cookie",
    "window.location",
    "xmlns:html",
    "<html",
    "<body",
  ];

  for (const pattern of dangerousPatterns) {
    if (combinedSample.includes(pattern)) {
      return {
        safe: false,
        reason: `Potential exploit or script injection vector detected: "${pattern}"`,
      };
    }
  }

  // 3. Category-specific checks
  if (category === "pdf") {
    // Check for malicious JavaScript embedded inside PDF dictionary objects
    if (combinedSample.includes("/javascript") || combinedSample.includes("/js ")) {
      return {
        safe: false,
        reason: "Executable JavaScript action detected in PDF document",
      };
    }
    if (combinedSample.includes("/launch") || combinedSample.includes("/embeddedfiles")) {
      return {
        safe: false,
        reason: "Potentially harmful executable launch action detected in PDF document",
      };
    }
  }

  return { safe: true };
}

/**
 * Validates an upload buffer against strict security, magic byte, and malware rules.
 */
export function validateUploadBuffer(
  buffer: Buffer,
  allowedCategories: ("image" | "pdf")[],
  options?: {
    maxBytes?: number;
    filename?: string;
  }
): {
  mimeType: string;
  extension: string;
  category: "image" | "pdf";
  sanitizedFilename: string;
} {
  const maxBytes =
    options?.maxBytes ??
    (allowedCategories.includes("pdf") ? 35_000_000 : 10_000_000);

  if (!buffer || buffer.length === 0) {
    throw new Error("Security Alert: Uploaded file is empty.");
  }

  if (buffer.length > maxBytes) {
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(1);
    throw new Error(`Security Alert: File size exceeds the maximum allowed limit of ${maxMb}MB.`);
  }

  // 1. Verify Magic Bytes
  const detected = detectFileSignature(buffer);
  if (!detected) {
    throw new Error(
      "Security Alert: Unrecognized or corrupted file format. Only verified JPG, PNG, WebP, GIF, or PDF files are accepted."
    );
  }

  if (!allowedCategories.includes(detected.category)) {
    throw new Error(
      `Security Alert: Disallowed file type (${detected.mimeType}). Expected: ${allowedCategories.join(", ")}.`
    );
  }

  // 2. Malware & Exploit Scanning
  const threatCheck = scanBufferForThreats(buffer, detected.category);
  if (!threatCheck.safe) {
    console.error("[Security Alert] Upload blocked:", threatCheck.reason);
    throw new Error(`Upload Rejected: File failed integrity and malware safety checks (${threatCheck.reason}).`);
  }

  // 3. Sanitize filename
  const sanitizedFilename = sanitizeSafeFilename(
    options?.filename || `file.${detected.extension}`,
    detected.extension
  );

  return {
    mimeType: detected.mimeType,
    extension: detected.extension,
    category: detected.category,
    sanitizedFilename,
  };
}

/**
 * Sanitizes user-supplied filenames to prevent path traversal, control characters,
 * or extension spoofing.
 */
export function sanitizeSafeFilename(rawFilename: string, trustedExt: string): string {
  // Strip null bytes, non-printable characters, remove path traversal ..
  const clean = rawFilename
    // eslint-disable-next-line no-control-regex
    .replace(/[\0\x00-\x1f\x7f-\x9f]/g, "")
    .replace(/\.\./g, "")
    .replace(/[/\\]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();

  const base = clean
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  const safeBase = base || "mosiac-file";
  const cleanExt = trustedExt.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  return `${safeBase}.${cleanExt}`;
}

/**
 * Validates that a requested path stays strictly within the target directory,
 * preventing path traversal attacks.
 */
export function isPathSafe(baseDir: string, relativePath: string): boolean {
  if (!relativePath || typeof relativePath !== "string") return false;
  if (relativePath.includes("\0")) return false;

  const normalized = path.normalize(relativePath);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) return false;

  const resolved = path.resolve(baseDir, normalized);
  const resolvedBase = path.resolve(baseDir);

  return resolved.startsWith(resolvedBase);
}

/**
 * Produces hardened HTTP headers for serving media and trusted downloads.
 */
export function getSecurityHeaders(options?: {
  isDownload?: boolean;
  filename?: string;
  contentType?: string;
  cacheControl?: string;
}): HeadersInit {
  const headers: Record<string, string> = {
    // 1. Prevent MIME sniffing (vital for preventing XSS via uploaded images)
    "X-Content-Type-Options": "nosniff",

    // 2. Prevent clickjacking
    "X-Frame-Options": "SAMEORIGIN",

    // 3. Strict Referrer Policy
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // 4. Content Security Policy for media endpoints: disables scripts entirely
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",

    // 5. Cross-Origin Resource Policy
    "Cross-Origin-Resource-Policy": "cross-origin",

    // 6. Cache control
    "Cache-Control": options?.cacheControl ?? "public, max-age=31536000, immutable",
  };

  if (options?.contentType) {
    headers["Content-Type"] = options.contentType;
  }

  if (options?.isDownload) {
    const safeName = options.filename
      ? options.filename.replace(/[^a-zA-Z0-9._-]/g, "_")
      : "download";
    headers["Content-Disposition"] = `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`;
  } else {
    headers["Content-Disposition"] = "inline";
  }

  return headers;
}

/**
 * In-memory sliding window rate limiter for API endpoints (form submissions, CAPI, webhooks).
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests = 30,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    const newRecord = { count: 1, resetAt: now + windowMs };
    rateLimitMap.set(key, newRecord);
    return { allowed: true, remaining: maxRequests - 1, resetAt: newRecord.resetAt };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

// Clean up stale rate limit entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetAt) {
        rateLimitMap.delete(k);
      }
    }
  }, 5 * 60_000);
}
