// Macedonian mobile phone: 07X XXX XXX or +389 7X XXX XXX
const MK_PHONE_REGEX = /^(\+389|0)(7[0-8])\d{6}$/

export function isValidMkPhone(value: string): boolean {
  if (!value) return true // empty is valid (optional field)
  const cleaned = value.replace(/[\s\-]/g, '')
  return MK_PHONE_REGEX.test(cleaned)
}

/**
 * Format raw digits into readable form: 07X XXX XXX
 * Input: digits only (after stripping +389 prefix if present)
 */
export function formatMkPhone(raw: string): string {
  // Strip everything except digits
  const digits = raw.replace(/\D/g, '')

  // If it starts with 389, treat as international
  let local = digits
  if (digits.startsWith('389') && digits.length > 3) {
    local = '0' + digits.substring(3)
  }

  // Format as 07X XXX XXX
  if (local.length <= 3) return local
  if (local.length <= 6) return local.substring(0, 3) + ' ' + local.substring(3)
  return local.substring(0, 3) + ' ' + local.substring(3, 6) + ' ' + local.substring(6, 9)
}

/**
 * Convert display value to storable format (07XXXXXXX)
 */
export function cleanPhone(value: string): string {
  return value.replace(/[\s\-]/g, '')
}
