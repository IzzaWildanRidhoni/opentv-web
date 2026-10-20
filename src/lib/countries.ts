let displayNames: Intl.DisplayNames | null = null;

try {
  displayNames = new Intl.DisplayNames(['id'], { type: 'region' });
} catch {
  displayNames = null;
}

export function countryName(code: string): string {
  if (!code) return 'Tidak diketahui';
  if (!displayNames) return code;

  try {
    return displayNames.of(code) ?? code;
  } catch {
    return code;
  }
}
