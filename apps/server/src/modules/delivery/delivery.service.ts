import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { DeliveryJobStatus } from "@prisma/client";
import { PricingService, PricingQuote, VehicleType } from "./pricing.service";
import { DeliveryGateway } from "./delivery.gateway";
import { LatLng, RoutesService } from "../maps/routes.service";
import { CreateParcelJobDto } from "./dto/delivery.dto";

const ALL_VEHICLES: VehicleType[] = ["bike", "car", "van"];
const NEARBY_RADIUS_KM = 10;
const MAX_OFFER_DRIVERS = 25;

const ACTIVE_STATUSES: DeliveryJobStatus[] = [
  "ASSIGNED",
  "EN_ROUTE_PICKUP",
  "ARRIVED_PICKUP",
  "PICKED_UP",
  "EN_ROUTE_DROPOFF",
];

const COMPLETED_STATUSES: DeliveryJobStatus[] = ["DELIVERED", "CANCELLED"];

/**
 * The unified delivery/dispatch engine. Owns job creation for every surface
 * (parcel, product order, food), driver matching, the status lifecycle, and
 * driver payout. Every price written here comes from {@link PricingService} so
 * the customer never controls the fee.
 */
@Injectable()
export class DeliveryService {
  private readonly logger = new Logger("DeliveryService");

  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
    private readonly routes: RoutesService,
    @Inject(forwardRef(() => DeliveryGateway))
    private readonly gateway: DeliveryGateway
  ) {}

  // ─── Quoting ───────────────────────────────────────────────────────────────

  /** Quote all vehicle types for a route (book-a-rider selection screen). */
  async quoteAll(pickup: LatLng, dropoff: LatLng): Promise<PricingQuote[]> {
    return Promise.all(
      ALL_VEHICLES.map((vehicleType) => this.pricing.quote({ vehicleType, pickup, dropoff }))
    );
  }

  async quoteOne(vehicleType: VehicleType, pickup: LatLng, dropoff: LatLng): Promise<PricingQuote> {
    return this.pricing.quote({ vehicleType, pickup, dropoff });
  }

  // ─── Job creation ────────────────────────────────────────────────────────

  /** Customer-initiated passenger/parcel trip. */
  async createParcelJob(customerId: string, dto: CreateParcelJobDto) {
    const quote = await this.pricing.quote({
      vehicleType: dto.vehicleType,
      pickup: { lat: dto.pickupLat, lng: dto.pickupLng },
      dropoff: { lat: dto.dropoffLat, lng: dto.dropoffLng },
    });

    const job = await this.prisma.deliveryJob.create({
      data: {
        jobNumber: this.generateJobNumber(),
        type: "PARCEL",
        status: "PENDING",
        customerId,
        vehicleType: dto.vehicleType,
        pickupAddress: dto.pickupAddress,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        dropoffAddress: dto.dropoffAddress,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
        ...this.quoteToJobFields(quote),
      },
    });

    await this.offerJob(job);
    return job;
  }

  /**
   * Create the delivery leg for a paid marketplace order. Called from the
   * payment pipeline once funds are confirmed. Idempotent per order, and
   * best-effort: returns null (without throwing) if pickup/dropoff coordinates
   * can't be resolved, so a geocoding hiccup never blocks a paid order.
   */
  async createJobForOrder(orderId: string) {
    const existing = await this.prisma.deliveryJob.findUnique({ where: { orderId } });
    if (existing) return existing;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shippingAddress: true,
        items: { take: 1, include: { product: { select: { vendorId: true } } } },
      },
    });
    if (!order) return null;

    const vendorId = order.items[0]?.product?.vendorId;
    if (!vendorId) return null; // platform-fulfilled order, no vendor pickup

    const pickup = await this.resolveVendorPickup(vendorId);
    const dropoff = await this.resolveDropoff({
      latitude: order.shippingAddress.latitude,
      longitude: order.shippingAddress.longitude,
      addressParts: [
        order.shippingAddress.address,
        order.shippingAddress.city,
        order.shippingAddress.state,
      ],
    });
    if (!pickup || !dropoff) {
      this.logger.warn(`Order ${orderId}: could not resolve coordinates, no delivery job created`);
      return null;
    }

    const dropoffAddress = [order.shippingAddress.address, order.shippingAddress.city]
      .filter(Boolean)
      .join(", ");

    return this.createOrderTypeJob({
      type: "ORDER",
      orderId,
      customerId: order.userId,
      pickup: pickup.coords,
      pickupAddress: pickup.address,
      dropoff,
      dropoffAddress,
    });
  }

  /** Create the delivery leg for a paid food order. Idempotent, best-effort. */
  async createJobForFoodOrder(foodOrderId: string) {
    const existing = await this.prisma.deliveryJob.findUnique({ where: { foodOrderId } });
    if (existing) return existing;

    const foodOrder = await this.prisma.foodOrder.findUnique({ where: { id: foodOrderId } });
    if (!foodOrder) return null;

    const pickup = await this.resolveVendorPickup(foodOrder.vendorId);
    const dropoff = await this.resolveDropoff({
      latitude: foodOrder.deliveryLat,
      longitude: foodOrder.deliveryLng,
      addressParts: [foodOrder.deliveryAddress],
    });
    if (!pickup || !dropoff) {
      this.logger.warn(`Food order ${foodOrderId}: could not resolve coordinates, no job created`);
      return null;
    }

    return this.createOrderTypeJob({
      type: "FOOD",
      foodOrderId,
      customerId: foodOrder.userId,
      pickup: pickup.coords,
      pickupAddress: pickup.address,
      dropoff,
      dropoffAddress: foodOrder.deliveryAddress ?? "Delivery address",
    });
  }

  /**
   * Price a not-yet-created marketplace order's delivery (used at checkout to
   * set the shipping fee). Returns null when coordinates can't be resolved so
   * the caller can fall back to a flat fee.
   */
  async quoteForOrderDraft(params: {
    vendorId: string | null | undefined;
    dropoff: {
      latitude?: number | null;
      longitude?: number | null;
      addressParts: (string | null)[];
    };
    vehicleType?: VehicleType;
  }): Promise<PricingQuote | null> {
    if (!params.vendorId) return null;
    const pickup = await this.resolveVendorPickup(params.vendorId);
    const dropoff = await this.resolveDropoff(params.dropoff);
    if (!pickup || !dropoff) return null;
    return this.pricing.quote({
      vehicleType: params.vehicleType ?? "bike",
      pickup: pickup.coords,
      dropoff,
    });
  }

  private async createOrderTypeJob(params: {
    type: "ORDER" | "FOOD";
    orderId?: string;
    foodOrderId?: string;
    customerId: string;
    vehicleType?: VehicleType;
    pickup: LatLng;
    pickupAddress: string;
    dropoff: LatLng;
    dropoffAddress: string;
  }) {
    const vehicleType = params.vehicleType ?? "bike";
    const quote = await this.pricing.quote({
      vehicleType,
      pickup: params.pickup,
      dropoff: params.dropoff,
    });

    const job = await this.prisma.deliveryJob.create({
      data: {
        jobNumber: this.generateJobNumber(),
        type: params.type,
        status: "PENDING",
        customerId: params.customerId,
        orderId: params.orderId ?? null,
        foodOrderId: params.foodOrderId ?? null,
        vehicleType,
        pickupAddress: params.pickupAddress,
        pickupLat: params.pickup.lat,
        pickupLng: params.pickup.lng,
        dropoffAddress: params.dropoffAddress,
        dropoffLat: params.dropoff.lat,
        dropoffLng: params.dropoff.lng,
        ...this.quoteToJobFields(quote),
      },
    });

    await this.offerJob(job);
    return job;
  }

  /** Vendor pickup coordinates, geocoding + persisting the shop address on demand. */
  async resolveVendorPickup(vendorId: string): Promise<{ coords: LatLng; address: string } | null> {
    const vendor = await this.prisma.vendorProfile.findUnique({ where: { id: vendorId } });
    if (!vendor) return null;

    const address = [vendor.address, vendor.city, vendor.state].filter(Boolean).join(", ");

    if (vendor.latitude != null && vendor.longitude != null) {
      return {
        coords: { lat: vendor.latitude, lng: vendor.longitude },
        address: address || vendor.shopName,
      };
    }

    const geocoded = await this.routes.geocode(address);
    if (!geocoded) return null;

    await this.prisma.vendorProfile.update({
      where: { id: vendorId },
      data: { latitude: geocoded.lat, longitude: geocoded.lng },
    });
    return { coords: geocoded, address: address || vendor.shopName };
  }

  /** Dropoff coordinates from explicit lat/lng, else geocoded from the address. */
  async resolveDropoff(input: {
    latitude?: number | null;
    longitude?: number | null;
    addressParts: (string | null)[];
  }): Promise<LatLng | null> {
    if (input.latitude != null && input.longitude != null) {
      return { lat: input.latitude, lng: input.longitude };
    }
    const address = input.addressParts.filter(Boolean).join(", ");
    if (!address) return null;
    return this.routes.geocode(address);
  }

  // ─── Dispatcher task feed ──────────────────────────────────────────────────

  async getAvailableJobs(
    profile: { id: string; lastLatitude: number | null; lastLongitude: number | null },
    page = 1,
    limit = 20
  ) {
    const skip = (page - 1) * limit;
    // Bounding-box prefilter around the driver when we know where they are.
    const where: any = { status: "PENDING", dispatcherId: null };
    if (profile.lastLatitude != null && profile.lastLongitude != null) {
      const box = this.boundingBox(
        { lat: profile.lastLatitude, lng: profile.lastLongitude },
        NEARBY_RADIUS_KM
      );
      where.pickupLat = { gte: box.minLat, lte: box.maxLat };
      where.pickupLng = { gte: box.minLng, lte: box.maxLng };
    }

    const [jobs, total] = await Promise.all([
      this.prisma.deliveryJob.findMany({
        where,
        skip,
        take: limit,
        include: { customer: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.deliveryJob.count({ where }),
    ]);

    return { jobs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getDispatcherJobs(
    dispatcherId: string,
    status: "active" | "completed",
    page = 1,
    limit = 20
  ) {
    const statuses = status === "active" ? ACTIVE_STATUSES : COMPLETED_STATUSES;
    const skip = (page - 1) * limit;
    const where = { dispatcherId, status: { in: statuses } };

    const [jobs, total] = await Promise.all([
      this.prisma.deliveryJob.findMany({
        where,
        skip,
        take: limit,
        include: { customer: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.deliveryJob.count({ where }),
    ]);

    return { jobs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  /** Atomic first-accept-wins claim. */
  async acceptJob(profile: { id: string; status: string }, jobId: string) {
    if (profile.status !== "ONLINE") {
      throw new BadRequestException("You must be ONLINE to accept jobs");
    }

    // Conditional update: only succeeds if the job is still unclaimed. This is
    // the same oversell-guard pattern used for stock in orders.service.
    const claim = await this.prisma.deliveryJob.updateMany({
      where: { id: jobId, status: "PENDING", dispatcherId: null },
      data: { dispatcherId: profile.id, status: "ASSIGNED", acceptedAt: new Date() },
    });
    if (claim.count === 0) {
      throw new BadRequestException("This job is no longer available");
    }

    const job = await this.loadJobWithParties(jobId);
    this.gateway.emitJobUpdate(this.toJobEvent(job));
    return job;
  }

  async updateJobStatus(
    profile: { id: string },
    jobId: string,
    status: (typeof ACTIVE_STATUSES)[number] | "DELIVERED"
  ) {
    const job = await this.prisma.deliveryJob.findUnique({ where: { id: jobId } });
    if (!job || job.dispatcherId !== profile.id) {
      throw new ForbiddenException("Not your job");
    }
    if (job.status === "DELIVERED" || job.status === "CANCELLED") {
      throw new BadRequestException("Job already finalized");
    }

    if (status === "DELIVERED") {
      await this.markDeliveredWithPayout(job);
    } else {
      await this.prisma.deliveryJob.update({ where: { id: jobId }, data: { status } });
    }

    const updated = await this.loadJobWithParties(jobId);
    this.gateway.emitJobUpdate(this.toJobEvent(updated));
    return updated;
  }

  /** Customer confirms receipt → driver's held payout clears to spendable balance. */
  async confirmDelivery(customerId: string, jobId: string) {
    const job = await this.prisma.deliveryJob.findUnique({ where: { id: jobId } });
    if (!job || job.customerId !== customerId) throw new ForbiddenException("Not your job");
    if (job.status !== "DELIVERED") {
      throw new BadRequestException("Job is not delivered yet");
    }
    if (!job.dispatcherId) return job;

    const dispatcher = await this.prisma.dispatcherProfile.findUnique({
      where: { id: job.dispatcherId },
    });
    if (!dispatcher) return job;

    const wallet = await this.ensureWallet(dispatcher.userId);
    const payout = Number(job.driverPayout);

    await this.prisma.$transaction([
      this.prisma.dispatcherProfile.update({
        where: { id: dispatcher.id },
        data: { pendingPayout: { decrement: payout } },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: payout } },
      }),
      this.prisma.transaction.updateMany({
        where: { reference: this.payoutReference(job.id) },
        data: { status: "COMPLETED" },
      }),
    ]);

    return job;
  }

  // ─── Tracking ──────────────────────────────────────────────────────────────

  async getJob(jobId: string, userId: string) {
    const job = await this.loadJobWithParties(jobId);
    if (!job) throw new NotFoundException("Job not found");
    const isCustomer = job.customerId === userId;
    const isDriver = job.dispatcher?.user?.id === userId;
    if (!isCustomer && !isDriver) throw new ForbiddenException("Not your job");
    return job;
  }

  async getCustomerJobs(customerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { customerId };
    const [jobs, total] = await Promise.all([
      this.prisma.deliveryJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.deliveryJob.count({ where }),
    ]);
    return { jobs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async cancelJob(userId: string, jobId: string) {
    const job = await this.prisma.deliveryJob.findUnique({ where: { id: jobId } });
    if (!job || job.customerId !== userId) throw new ForbiddenException("Not your job");
    if (["PICKED_UP", "EN_ROUTE_DROPOFF", "DELIVERED"].includes(job.status)) {
      throw new BadRequestException("Cannot cancel after pickup");
    }
    const updated = await this.prisma.deliveryJob.update({
      where: { id: jobId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    this.gateway.emitJobUpdate(this.toJobEvent({ ...job, ...updated, dispatcher: null } as any));
    return updated;
  }

  /** Persist a dispatcher's live position (called from the gateway). */
  async recordDriverLocation(userId: string, lat: number, lng: number) {
    await this.prisma.dispatcherProfile.updateMany({
      where: { userId },
      data: { lastLatitude: lat, lastLongitude: lng, lastLocationAt: new Date() },
    });
  }

  // ─── Internals ───────────────────────────────────────────────────────────

  private async markDeliveredWithPayout(job: {
    id: string;
    dispatcherId: string | null;
    customerFee: any;
    platformCommission: any;
    driverPayout: any;
  }) {
    if (!job.dispatcherId) {
      await this.prisma.deliveryJob.update({
        where: { id: job.id },
        data: { status: "DELIVERED", deliveredAt: new Date() },
      });
      return;
    }

    const dispatcher = await this.prisma.dispatcherProfile.findUnique({
      where: { id: job.dispatcherId },
    });
    if (!dispatcher) throw new NotFoundException("Dispatcher not found");
    const wallet = await this.ensureWallet(dispatcher.userId);

    const payout = Number(job.driverPayout);
    const commission = Number(job.platformCommission);
    const gross = Number(job.customerFee);

    // Payout is HELD in pendingPayout (not spendable) until the customer
    // confirms receipt — see confirmDelivery. This fixes the previous bug where
    // earnings landed in both pendingPayout AND the withdrawable balance.
    await this.prisma.$transaction([
      this.prisma.deliveryJob.update({
        where: { id: job.id },
        data: { status: "DELIVERED", deliveredAt: new Date() },
      }),
      this.prisma.dispatcherProfile.update({
        where: { id: dispatcher.id },
        data: {
          totalEarnings: { increment: payout },
          pendingPayout: { increment: payout },
        },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: "EARNINGS",
          status: "PENDING",
          amount: gross,
          fee: commission,
          netAmount: payout,
          currency: wallet.currency,
          reference: this.payoutReference(job.id),
          description: `Delivery payout for job ${job.id.slice(-6)}`,
          metadata: { jobId: job.id, commission },
        },
      }),
    ]);
  }

  /** Find nearby online drivers and push them the offer over the socket. */
  private async offerJob(job: {
    id: string;
    customerId: string;
    pickupLat: number;
    pickupLng: number;
  }) {
    try {
      const box = this.boundingBox({ lat: job.pickupLat, lng: job.pickupLng }, NEARBY_RADIUS_KM);
      let drivers = await this.prisma.dispatcherProfile.findMany({
        where: {
          status: "ONLINE",
          lastLatitude: { gte: box.minLat, lte: box.maxLat },
          lastLongitude: { gte: box.minLng, lte: box.maxLng },
        },
        select: { userId: true, lastLatitude: true, lastLongitude: true },
        take: MAX_OFFER_DRIVERS,
      });

      // Fallback so jobs aren't stranded when no driver has shared GPS yet.
      if (drivers.length === 0) {
        drivers = await this.prisma.dispatcherProfile.findMany({
          where: { status: "ONLINE" },
          select: { userId: true, lastLatitude: true, lastLongitude: true },
          take: MAX_OFFER_DRIVERS,
        });
      }

      this.gateway.emitJobOffer(
        drivers.map((d) => d.userId),
        job
      );
    } catch (err) {
      // Matching is best-effort; drivers also poll the available feed.
      this.logger.warn(`offerJob failed for ${job.id}: ${(err as Error).message}`);
    }
  }

  private async ensureWallet(userId: string) {
    const existing = await this.prisma.wallet.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.wallet.create({ data: { userId, balance: 0, currency: "GHS" } });
  }

  private loadJobWithParties(jobId: string) {
    return this.prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: {
        customer: { select: { id: true, name: true, image: true } },
        dispatcher: {
          select: {
            id: true,
            vehicleType: true,
            plateNumber: true,
            lastLatitude: true,
            lastLongitude: true,
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });
  }

  private toJobEvent(job: any) {
    return {
      id: job.id,
      status: job.status,
      customerId: job.customerId,
      dispatcherUserId: job.dispatcher?.user?.id ?? null,
    };
  }

  private quoteToJobFields(quote: PricingQuote) {
    return {
      distanceMeters: quote.distanceMeters,
      durationSeconds: quote.durationSeconds,
      routePolyline: quote.polyline,
      baseFare: quote.baseFare,
      distanceFare: quote.distanceFare,
      timeFare: quote.timeFare,
      surgeMultiplier: quote.surgeMultiplier,
      customerFee: quote.customerFee,
      platformCommission: quote.platformCommission,
      driverPayout: quote.driverPayout,
    };
  }

  private payoutReference(jobId: string): string {
    return `DLV-ERN-${jobId}`;
  }

  private generateJobNumber(): string {
    return `BXJ-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
  }

  /** Approximate lat/lng bounding box for a radius in km. */
  private boundingBox(center: LatLng, radiusKm: number) {
    const latDelta = radiusKm / 111; // ~111 km per degree latitude
    const lngDelta = radiusKm / (111 * Math.cos((center.lat * Math.PI) / 180) || 1);
    return {
      minLat: center.lat - latDelta,
      maxLat: center.lat + latDelta,
      minLng: center.lng - lngDelta,
      maxLng: center.lng + lngDelta,
    };
  }
}
