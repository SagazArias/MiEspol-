import { CAMPUS_CENTER } from '../data/destinations';

export type WeatherSnapshot = {
  temperatureC: number;
  humidity: number;
  windKmh: number;
  uvIndex: number;
  precipitationProbability: number;
  weatherCode: number;
  isDay: boolean;
  fetchedAt: string;
};

export async function fetchCampusWeather(): Promise<WeatherSnapshot> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${CAMPUS_CENTER.lat}&longitude=${CAMPUS_CENTER.lng}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day` +
    `&hourly=precipitation_probability,uv_index&timezone=America%2FGuayaquil&forecast_days=1`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Clima no disponible (${res.status})`);
  }

  const data = await res.json();
  const nowIso: string = data.current?.time ?? new Date().toISOString();
  const hourIndex = Array.isArray(data.hourly?.time)
    ? data.hourly.time.findIndex((t: string) => t === nowIso.slice(0, 13) + ':00')
    : -1;
  const idx = hourIndex >= 0 ? hourIndex : 0;

  return {
    temperatureC: Number(data.current?.temperature_2m ?? 28),
    humidity: Number(data.current?.relative_humidity_2m ?? 70),
    windKmh: Number(data.current?.wind_speed_10m ?? 8),
    uvIndex: Number(data.hourly?.uv_index?.[idx] ?? 6),
    precipitationProbability: Number(data.hourly?.precipitation_probability?.[idx] ?? 20),
    weatherCode: Number(data.current?.weather_code ?? 0),
    isDay: Boolean(data.current?.is_day ?? 1),
    fetchedAt: new Date().toISOString(),
  };
}

export function weatherAdvice(w: WeatherSnapshot): string {
  if (w.precipitationProbability >= 60) {
    return 'Alta probabilidad de lluvia: prioriza rutas cubiertas o con buen drenaje.';
  }
  if (w.uvIndex >= 8 || w.temperatureC >= 31) {
    return 'Calor/UV alto: prioriza sombra y menor exposición térmica.';
  }
  if (w.windKmh >= 25) {
    return 'Viento fuerte: evita zonas abiertas del malecón si es posible.';
  }
  return 'Condiciones favorables para caminar por el campus.';
}
