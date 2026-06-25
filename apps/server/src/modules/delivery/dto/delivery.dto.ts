import { IsNumber, IsString, IsNotEmpty, IsIn, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export const VEHICLE_TYPES = ["bike", "car", "van"] as const;

export class QuoteDeliveryDto {
  @ApiProperty()
  @IsNumber()
  pickupLat: number;

  @ApiProperty()
  @IsNumber()
  pickupLng: number;

  @ApiProperty()
  @IsNumber()
  dropoffLat: number;

  @ApiProperty()
  @IsNumber()
  dropoffLng: number;

  @ApiProperty({
    enum: VEHICLE_TYPES,
    required: false,
    description: "Omit to quote all vehicle types",
  })
  @IsOptional()
  @IsIn(VEHICLE_TYPES)
  vehicleType?: (typeof VEHICLE_TYPES)[number];
}

export class CreateParcelJobDto {
  @ApiProperty({ enum: VEHICLE_TYPES })
  @IsIn(VEHICLE_TYPES)
  vehicleType: (typeof VEHICLE_TYPES)[number];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @ApiProperty()
  @IsNumber()
  pickupLat: number;

  @ApiProperty()
  @IsNumber()
  pickupLng: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dropoffAddress: string;

  @ApiProperty()
  @IsNumber()
  dropoffLat: number;

  @ApiProperty()
  @IsNumber()
  dropoffLng: number;
}

// Dispatcher-driven lifecycle transitions.
export const DISPATCHER_JOB_STATUSES = [
  "EN_ROUTE_PICKUP",
  "ARRIVED_PICKUP",
  "PICKED_UP",
  "EN_ROUTE_DROPOFF",
  "DELIVERED",
] as const;

export class UpdateJobStatusDto {
  @ApiProperty({ enum: DISPATCHER_JOB_STATUSES })
  @IsIn(DISPATCHER_JOB_STATUSES)
  status: (typeof DISPATCHER_JOB_STATUSES)[number];
}
