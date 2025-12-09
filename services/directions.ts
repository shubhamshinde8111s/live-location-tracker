import type { LatLng } from 'react-native-maps';

export type TransportMode = 'driving' | 'bicycling' | 'walking' | 'transit';

export type RouteResult = {
  coordinates: LatLng[];
  distanceKm: number;    
  durationText: string;    
  summary: string;         
};

const OSRM_BASE_URL = 'https://router.project-osrm.org';

// OSRM profiles: driving / cycling / walking
const OSRM_PROFILE_MAP: Record<TransportMode, string> = {
  driving: 'driving',
  bicycling: 'cycling',
  walking: 'walking',
  transit: 'driving',
};

/*Local fallback helpers */

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

const FALLBACK_SPEED_KMH: Record<TransportMode, number> = {
  driving: 40,
  bicycling: 15,
  walking: 5,
  transit: 60,
};

function formatDurationFromMinutes(minutes: number): string {
  const min = Math.max(1, Math.round(minutes));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

function formatDurationFromSeconds(seconds: number): string {
  return formatDurationFromMinutes(seconds / 60);
}

function estimateDurationText(distanceKm: number, mode: TransportMode): string {
  const speed = FALLBACK_SPEED_KMH[mode] ?? 40; // km/h
  const hours = distanceKm / speed;
  const minutes = hours * 60;
  return formatDurationFromMinutes(minutes);
}

function buildFallbackRoute(
  origin: LatLng,
  destination: LatLng,
  mode: TransportMode
): RouteResult {
  const distanceKm = haversineDistanceKm(origin, destination);

  return {
    coordinates: [origin, destination],
    distanceKm,
    durationText: estimateDurationText(distanceKm, mode),
    summary: `Approximate ${mode} route (fallback)`,
  };
}

/*fetch route via OSRM */
export async function fetchRoute(
  origin: LatLng,
  destination: LatLng,
  mode: TransportMode
): Promise<RouteResult> {
  const profile = OSRM_PROFILE_MAP[mode];

  const coordsSegment = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;

  const url =
    `${OSRM_BASE_URL}/route/v1/${profile}/${coordsSegment}` +
    `?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    const text = await res.text();

    if (!res.ok) {
      console.warn('[OSRM] Request failed:', res.status, text);
      return buildFallbackRoute(origin, destination, mode);
    }

    const data = JSON.parse(text);

    if (!data.routes || data.routes.length === 0) {
      console.warn('[OSRM] No routes returned, using fallback');
      return buildFallbackRoute(origin, destination, mode);
    }

    const route = data.routes[0];

    const distanceKm = (route.distance ?? 0) / 1000;

    const durationText = estimateDurationText(distanceKm, mode);

    const coordinates: LatLng[] =
      route.geometry &&
      route.geometry.type === 'LineString' &&
      Array.isArray(route.geometry.coordinates)
        ? route.geometry.coordinates.map((pair: [number, number]) => ({
            longitude: pair[0],
            latitude: pair[1],
          }))
        : [origin, destination];

    const summary = route.legs?.[0]?.summary || `Route via ${profile}`;

    return {
      coordinates,
      distanceKm,
      durationText,
      summary,
    };
  } catch (err) {
    console.warn('[OSRM] Error calling API:', err);
    return buildFallbackRoute(origin, destination, mode);
  }
}
