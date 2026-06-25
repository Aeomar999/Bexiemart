import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RoutesService, LatLng, RouteResult, TravelMode } from "../maps/routes.service";

export type VehicleType = "bike" | "car" | "van";

/** Delivery pricing knobs, resolved from PlatformConfig (with safe defaults). */
export interface DeliveryPricingConfig {
  baseFare: number;
  perKm: number;
  perMin: number;
  minFee: number;
  commissionRate: number;
  surgeMultiplier: number;
  bikeMultiplier: number;
  carMultiplier: number;
  vanMultiplier: number;
}

export const DEFAULT_PRICING_CONFIG: DeliveryPricingConfig = {
  baseFare: 5,
  perKm: 1.5,
  perMin: 0.2,
  minFee: 6,
  commissionRate: 0.2,
  surgeMultiplier: 1,
  bikeMultiplier: 1,
  carMultiplier: 1.6,
  vanMultiplier: 2.2,
};

export interface PricingQuote {
  vehicleType: VehicleType;
  distanceMeters: number;
  durationSeconds: number;
  polyline: string | null;
  estimated: boolean;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  /** What the customer pays for delivery. */
  customerFee: number;
  /** What Bexiemart keeps. */
  platformCommission: number;
  /** customerFee - platformCommission. */
  driverPayout: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * The single source of truth for delivery pricing. Every surface (product
 * orders, food, book-a-rider) routes through {@link quote} so the customer fee,
 * platform commission, and driver payout are always server-computed and
 * tamper-proof — the client never sets the price.
 */
@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly routes: RoutesService
  ) {}

  async getConfig(): Promise<DeliveryPricingConfig> {
    const row = await this.prisma.platformConfig.findFirst();
    if (!row) return { ...DEFAULT_PRICING_CONFIG };
    return {
      baseFare: Number(row.deliveryBaseFare),
      perKm: Number(row.deliveryPerKm),
      perMin: Number(row.deliveryPerMin),
      minFee: Number(row.deliveryMinFee),
      commissionRate: Number(row.deliveryCommissionRate),
      surgeMultiplier: Number(row.deliverySurgeMultiplier),
      bikeMultiplier: Number(row.deliveryBikeMultiplier),
      carMultiplier: Number(row.deliveryCarMultiplier),
      vanMultiplier: Number(row.deliveryVanMultiplier),
    };
  }

  /** Resolve a route + price it in one call. */
  async quote(params: {
    vehicleType: VehicleType;
    pickup: LatLng;
    dropoff: LatLng;
  }): Promise<PricingQuote> {
    const config = await this.getConfig();
    const travelMode: TravelMode = params.vehicleType === "bike" ? "TWO_WHEELER" : "DRIVE";
    const route = await this.routes.computeRoute(params.pickup, params.dropoff, travelMode);
    return this.price(params.vehicleType, route, config);
  }

  /**
   * Pure pricing function: given a resolved route and config, produce the full
   * fee breakdown. Kept side-effect-free so the fare math is unit-testable
   * without touching Google or the database.
   */
  price(
    vehicleType: VehicleType,
    route: Pick<RouteResult, "distanceMeters" | "durationSeconds" | "polyline" | "estimated">,
    config: DeliveryPricingConfig
  ): PricingQuote {
    const km = route.distanceMeters / 1000;
    const minutes = route.durationSeconds / 60;

    const distanceFare = config.perKm * km;
    const timeFare = config.perMin * minutes;
    const vehicleMultiplier = this.vehicleMultiplier(vehicleType, config);

    const raw =
      (config.baseFare + distanceFare + timeFare) * vehicleMultiplier * config.surgeMultiplier;
    const customerFee = round2(Math.max(config.minFee, raw));
    const platformCommission = round2(customerFee * config.commissionRate);
    const driverPayout = round2(customerFee - platformCommission);

    return {
      vehicleType,
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      polyline: route.polyline,
      estimated: route.estimated,
      baseFare: round2(config.baseFare),
      distanceFare: round2(distanceFare),
      timeFare: round2(timeFare),
      surgeMultiplier: config.surgeMultiplier,
      customerFee,
      platformCommission,
      driverPayout,
    };
  }

  private vehicleMultiplier(vehicleType: VehicleType, config: DeliveryPricingConfig): number {
    switch (vehicleType) {
      case "car":
        return config.carMultiplier;
      case "van":
        return config.vanMultiplier;
      case "bike":
      default:
        return config.bikeMultiplier;
    }
  }
}
