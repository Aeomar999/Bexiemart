import { mockPrisma } from "../../prisma/prisma.mock";
import { PricingService, DEFAULT_PRICING_CONFIG, DeliveryPricingConfig } from "./pricing.service";
import { RouteResult } from "../maps/routes.service";

const route = (distanceMeters: number, durationSeconds: number): RouteResult => ({
  distanceMeters,
  durationSeconds,
  polyline: "abc",
  estimated: false,
});

describe("PricingService", () => {
  let service: PricingService;
  let prisma: ReturnType<typeof mockPrisma>;
  let routes: { computeRoute: jest.Mock };

  const config: DeliveryPricingConfig = { ...DEFAULT_PRICING_CONFIG };

  beforeEach(() => {
    prisma = mockPrisma();
    routes = { computeRoute: jest.fn() };
    service = new PricingService(prisma as any, routes as any);
  });

  describe("price()", () => {
    it("computes base + distance + time fares for a bike", () => {
      // 5km, 12min: base 5 + 1.5*5 (7.5) + 0.2*12 (2.4) = 14.9, bike mult 1, surge 1
      const q = service.price("bike", route(5000, 720), config);
      expect(q.distanceFare).toBe(7.5);
      expect(q.timeFare).toBe(2.4);
      expect(q.customerFee).toBe(14.9);
    });

    it("enforces the minimum fee floor on very short trips", () => {
      // 0.2km, 1min → raw well below minFee 6 → clamps to 6
      const q = service.price("bike", route(200, 60), config);
      expect(q.customerFee).toBe(config.minFee);
    });

    it("keeps the invariant customerFee = driverPayout + platformCommission", () => {
      const q = service.price("car", route(8300, 1500), config);
      expect(round2(q.driverPayout + q.platformCommission)).toBe(q.customerFee);
    });

    it("splits commission at the configured rate", () => {
      const q = service.price("bike", route(5000, 720), config);
      expect(q.platformCommission).toBe(round2(q.customerFee * config.commissionRate));
    });

    it("applies the vehicle multiplier (van > car > bike)", () => {
      const bike = service.price("bike", route(10000, 1200), config).customerFee;
      const car = service.price("car", route(10000, 1200), config).customerFee;
      const van = service.price("van", route(10000, 1200), config).customerFee;
      expect(car).toBeGreaterThan(bike);
      expect(van).toBeGreaterThan(car);
    });

    it("scales the fare with the surge multiplier", () => {
      const surged = service.price("bike", route(10000, 1200), {
        ...config,
        surgeMultiplier: 2,
      });
      const normal = service.price("bike", route(10000, 1200), config);
      // base is also surged, so just assert it grew meaningfully
      expect(surged.customerFee).toBeGreaterThan(normal.customerFee);
    });
  });

  describe("quote()", () => {
    it("uses TWO_WHEELER routing for bikes and prices the resolved route", async () => {
      prisma.platformConfig.findFirst.mockResolvedValue(null); // → defaults
      routes.computeRoute.mockResolvedValue(route(5000, 720));

      const q = await service.quote({
        vehicleType: "bike",
        pickup: { lat: 5.6, lng: -0.2 },
        dropoff: { lat: 5.65, lng: -0.18 },
      });

      expect(routes.computeRoute).toHaveBeenCalledWith(
        { lat: 5.6, lng: -0.2 },
        { lat: 5.65, lng: -0.18 },
        "TWO_WHEELER"
      );
      expect(q.customerFee).toBe(14.9);
    });

    it("uses DRIVE routing for cars/vans", async () => {
      prisma.platformConfig.findFirst.mockResolvedValue(null);
      routes.computeRoute.mockResolvedValue(route(5000, 720));

      await service.quote({
        vehicleType: "car",
        pickup: { lat: 5.6, lng: -0.2 },
        dropoff: { lat: 5.65, lng: -0.18 },
      });

      expect(routes.computeRoute).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "DRIVE"
      );
    });
  });
});

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
