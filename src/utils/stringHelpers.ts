// Capitaliza la primera letra y pone el resto en minúscula
export function capitalize(word: string | null | undefined) {
  if (!word) return "";
  const trimmed = word.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}