export function generateBarcodeValue(code: string) {
  return code.trim();
}

export function isCode128Compatible(value: string) {
  return /^[\x20-\x7E]+$/.test(value);
}
