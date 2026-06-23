import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { DeliveryService } from "./delivery.service";
import { QuoteDeliveryDto, CreateParcelJobDto } from "./dto/delivery.dto";

@ApiBearerAuth()
@ApiTags("Delivery")
@Controller("delivery")
@UseGuards(AuthGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @ApiOperation({ summary: "Quote a delivery (all vehicle types unless one is specified)" })
  @Post("quote")
  quote(@Body() dto: QuoteDeliveryDto) {
    const pickup = { lat: dto.pickupLat, lng: dto.pickupLng };
    const dropoff = { lat: dto.dropoffLat, lng: dto.dropoffLng };
    if (dto.vehicleType) {
      return this.deliveryService.quoteOne(dto.vehicleType, pickup, dropoff);
    }
    return this.deliveryService.quoteAll(pickup, dropoff);
  }

  @ApiOperation({ summary: "Create a parcel/ride delivery job" })
  @Post("jobs")
  createJob(@Req() req: any, @Body() dto: CreateParcelJobDto) {
    return this.deliveryService.createParcelJob(req.user.id, dto);
  }

  @ApiOperation({ summary: "List my delivery jobs (as customer)" })
  @Get("jobs")
  myJobs(@Req() req: any, @Query("page") page?: string, @Query("limit") limit?: string) {
    return this.deliveryService.getCustomerJobs(
      req.user.id,
      Number(page) || 1,
      Number(limit) || 20
    );
  }

  @ApiOperation({ summary: "Get a job for live tracking (customer or assigned driver)" })
  @Get("jobs/:id")
  getJob(@Req() req: any, @Param("id") id: string) {
    return this.deliveryService.getJob(id, req.user.id);
  }

  @ApiOperation({ summary: "Confirm receipt — clears the driver's held payout" })
  @Post("jobs/:id/confirm")
  confirm(@Req() req: any, @Param("id") id: string) {
    return this.deliveryService.confirmDelivery(req.user.id, id);
  }

  @ApiOperation({ summary: "Cancel a job (before pickup)" })
  @Post("jobs/:id/cancel")
  cancel(@Req() req: any, @Param("id") id: string) {
    return this.deliveryService.cancelJob(req.user.id, id);
  }
}
