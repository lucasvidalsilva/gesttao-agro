// Zero-dependency TOTP Implementation using standard Web Crypto API (SubtleCrypto)
// Fully compatible with Cloudflare Workers (workerd) and Node.js.

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32ToBytes(base32: string): Uint8Array {
  const clean = base32.replace(/[\s=]/g, "").toUpperCase();
  const len = clean.length;
  const bytes = new Uint8Array(Math.floor((len * 5) / 8));

  let keep = 0;
  let keepBits = 0;
  let byteIdx = 0;

  for (let i = 0; i < len; i++) {
    const char = clean[i];
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) {
      throw new Error("Invalid base32 character: " + char);
    }

    keep = (keep << 5) | val;
    keepBits += 5;

    if (keepBits >= 8) {
      bytes[byteIdx++] = (keep >> (keepBits - 8)) & 255;
      keepBits -= 8;
    }
  }

  return bytes;
}

function bytesToBase32(bytes: Uint8Array): string {
  let result = "";
  let keep = 0;
  let keepBits = 0;

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    keep = (keep << 8) | byte;
    keepBits += 8;

    while (keepBits >= 5) {
      const idx = (keep >> (keepBits - 5)) & 31;
      result += BASE32_ALPHABET[idx];
      keepBits -= 5;
    }
  }

  if (keepBits > 0) {
    const idx = (keep << (5 - keepBits)) & 31;
    result += BASE32_ALPHABET[idx];
  }

  return result;
}

/**
 * Generates a random Base32 secret key of 20 bytes (160 bits).
 */
export function generateSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return bytesToBase32(bytes);
}

/**
 * Generates the standard TOTP URI for QR Code scanning.
 */
export function getProvisioningUri(email: string, secret: string): string {
  const label = encodeURIComponent(`Gestão Agro:${email}`);
  const issuer = encodeURIComponent("Gestão Agro");
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`;
}

/**
 * Generates a 6-digit TOTP token for a given secret and counter (time step).
 */
async function generateTokenAtCounter(secretBytes: Uint8Array, counter: number): Promise<string> {
  // Convert counter to 8-byte big-endian integer
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  // Write counter as 64-bit integer (split into two 32-bit halves)
  counterView.setUint32(0, 0); // High 32 bits (always 0 for current timestamps)
  counterView.setUint32(4, counter); // Low 32 bits

  const timeBytes = new Uint8Array(counterBuffer);

  // Import HMAC key
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes as any,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  // Sign time bytes
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, timeBytes as any);
  const signature = new Uint8Array(signatureBuffer);

  // Dynamic truncation
  const offset = signature[signature.length - 1] & 0xf;
  const binary =
    ((signature[offset] & 0x7f) << 24) |
    ((signature[offset + 1] & 0xff) << 16) |
    ((signature[offset + 2] & 0xff) << 8) |
    (signature[offset + 3] & 0xff);

  // Generate 6 digit token
  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Verifies a 6-digit TOTP token against a secret.
 * Employs a window size of 1 (checks current step, -1 step, and +1 step) to prevent latency issues.
 */
export async function verifyTotp(secret: string, token: string): Promise<boolean> {
  if (!token || token.length !== 6 || !/^\d+$/.test(token)) {
    return false;
  }

  try {
    const secretBytes = base32ToBytes(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const currentCounter = Math.floor(epoch / 30);

    // Check t-1, t, t+1 steps
    for (let offset = -1; offset <= 1; offset++) {
      const generated = await generateTokenAtCounter(secretBytes, currentCounter + offset);
      if (generated === token) {
        return true;
      }
    }
  } catch (error) {
    console.error("Error verifying TOTP:", error);
  }

  return false;
}
