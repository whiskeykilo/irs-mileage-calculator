const MAX_BUSINESS_REASON_LENGTH = 50;

/** Control chars U+0000–U+001F and U+007F (DEL); strip to avoid layout/encoding issues. */
const CONTROL_CHAR_REGEX = /[\u0000-\u001F\u007F]/g;

/**
 * Sanitizes optional business reason from request body.
 * Returns empty string for null/undefined/non-string; otherwise trims, strips control chars, caps at 50 chars.
 */
export function sanitizeBusinessReason(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  const stripped = trimmed.replace(CONTROL_CHAR_REGEX, "");
  return stripped.slice(0, MAX_BUSINESS_REASON_LENGTH);
}
