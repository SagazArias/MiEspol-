export function greetingForNow(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return '¡Buenos días!';
  if (h < 19) return '¡Buenas tardes!';
  return '¡Buenas noches!';
}

export function formatMeters(m: number) {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}
