/** Acepta formato internacional y móviles chilenos escritos sin prefijo. */
export function normalizePhone(value: string): string {
  const compact = value.trim().replace(/[\s()-]/g, "");
  if (/^9\d{8}$/.test(compact)) return `+56${compact}`;
  if (/^56\d{9}$/.test(compact)) return `+${compact}`;
  return compact;
}
export function phoneError(value: string): string | undefined {
  return /^\+[1-9]\d{7,14}$/.test(normalizePhone(value))
    ? undefined
    : "Ingresa un teléfono válido, por ejemplo +56 9 1234 5678.";
}
