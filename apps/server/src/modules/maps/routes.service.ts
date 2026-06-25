import { Injectable, Logger } from "@nestjs/common";
import NodeCache = require("node-cache");

export interface LatLng {
  lat: number;
  lng: number;
}

export type TravelMode = "DRIVE" | "TWO_WHEELER";

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  /** Google encoded polyline for drawing the route. Null on fallback. */
  polyline: string | null;
  /** True when this is a Haversine straight-line estimate, not a real route. */
  estimated: boolean;
}

const ROUTES_ENDPOINT = "https://routes.googleapis.com/directions/v2:computeRoutes";
const GEOCODE_ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json";

// Multiplier applied to straight-line distance to approximate real road
// distance when the Routes API is unavailable (no key / request failed).
const ROAD_FACTOR = 1.3;
// Assumed average urban speed (km/h) for fallback ETA.
const FALLBACK_SPEED_KMH = 25;

/**
 * Distance / ETA / route provider backed by Google Maps Platform.
 *
 * Pricing and tracking call {@link computeRoute}. Results are cached by a
 * rounded coordinate pair (~11m precision) to keep Google billing down — the
 * same pickup→dropoff pair is requested many times (quote, then job create).
 * Falls back to a Haversine estimate so local dev works without a key.
 */
@Injectable()
export class RoutesService {
  private readonly logger = new Logger("RoutesService");
  private readonly apiKey = process.env.GOOGLE_MAPS_API_KEY;
  private readonly cache = new NodeCache({ stdTTL: 600, maxKeys: 10000 });

  get hasApiKey(): boolean {
    return !!this.apiKey;
  }

  async computeRoute(
    origin: LatLng,
    destination: LatLng,
    travelMode: TravelMode = "DRIVE"
  ): Promise<RouteResult> {
    const key = `route:${travelMode}:${this.roundKey(origin)}:${this.roundKey(destination)}`;
    const cached = this.cache.get<RouteResult>(key);
    if (cached) return cached;

    let result: RouteResult;
    if (this.apiKey) {
      try {
        result = await this.callRoutesApi(origin, destination, travelMode);
      } catch (err) {
        this.logger.warn(
          `Routes API failed, falling back to Haversine estimate: ${(err as Error).message}`
        );
        result = this.haversineEstimate(origin, destination);
      }
    } else {
      result = this.haversineEstimate(origin, destination);
    }

    // Cache fallback estimates briefly so we re-try the real API soon after it
    // recovers, but cache real routes for the full TTL. Guard set() so a full
    // cache (maxKeys) can never throw and break the quote it's meant to speed up.
    try {
      this.cache.set(key, result, result.estimated ? 60 : 600);
    } catch {
      /* cache full — serve uncached */
    }
    return result;
  }

  /** Resolve a free-text address to coordinates. Null if unresolved / no key. */
  async geocode(address: string): Promise<LatLng | null> {
    const trimmed = address?.trim();
    if (!trimmed) return null;
    if (!this.apiKey) return null;

    const key = `geocode:${trimmed.toLowerCase()}`;
    const cached = this.cache.get<LatLng | null>(key);
    if (cached !== undefined) return cached;

    try {
      const url = `${GEOCODE_ENDPOINT}?address=${encodeURIComponent(trimmed)}&key=${this.apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Geocode HTTP ${res.status}`);
      const body = (await res.json()) as {
        status: string;
        results?: { geometry: { location: { lat: number; lng: number } } }[];
      };
      const loc = body.results?.[0]?.geometry?.location ?? null;
      const result = loc ? { lat: loc.lat, lng: loc.lng } : null;
      this.cache.set(key, result);
      return result;
    } catch (err) {
      this.logger.warn(`Geocode failed for "${trimmed}": ${(err as Error).message}`);
      return null;
    }
  }

  private async callRoutesApi(
    origin: LatLng,
    destination: LatLng,
    travelMode: TravelMode
  ): Promise<RouteResult> {
    const res = await fetch(ROUTES_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey as string,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: {
          location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
        },
        travelMode,
        routingPreference: travelMode === "DRIVE" ? "TRAFFIC_AWARE" : undefined,
      }),
    });

    if (!res.ok) {
      throw new Error(`Routes HTTP ${res.status}`);
    }

    const body = (await res.json()) as {
      routes?: {
        distanceMeters?: number;
        duration?: string;
        polyline?: { encodedPolyline?: string };
      }[];
    };

    const route = body.routes?.[0];
    if (!route || route.distanceMeters == null) {
      throw new Error("Routes API returned no usable route");
    }

    return {
      distanceMeters: route.distanceMeters,
      durationSeconds: this.parseDuration(route.duration),
      polyline: route.polyline?.encodedPolyline ?? null,
      estimated: false,
    };
  }

  private haversineEstimate(origin: LatLng, destination: LatLng): RouteResult {
    const straightLine = this.haversineMeters(origin, destination);
    const distanceMeters = Math.round(straightLine * ROAD_FACTOR);
    const durationSeconds = Math.round(distanceMeters / ((FALLBACK_SPEED_KMH * 1000) / 3600));
    return { distanceMeters, durationSeconds, polyline: null, estimated: true };
  }

  private haversineMeters(a: LatLng, b: LatLng): number {
    const R = 6_371_000; // Earth radius in metres
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  /** Google Routes durations look like "123s". */
  private parseDuration(duration?: string): number {
    if (!duration) return 0;
    const match = /^(\d+)s$/.exec(duration);
    return match ? Number(match[1]) : 0;
  }

  /** ~4dp ≈ 11m: tight enough for pricing, loose enough to cache effectively. */
  private roundKey(p: LatLng): string {
    return `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
  }
}
