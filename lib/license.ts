import crypto from "crypto";

/**
 * Generate a cryptographically secure license key
 * @returns 64-character hex string
 */
export function generateLicenseKey(): string {
  return crypto.randomBytes(32).toString("hex");
}
