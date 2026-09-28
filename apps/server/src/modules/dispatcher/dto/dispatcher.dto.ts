import { IsString, IsNotEmpty, IsNumber, IsIn, IsOptional, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateDispatcherDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  vehicleType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  vehiclePlate: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  vehicleModel?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  vehicleColor?: string;
}

export const DISPATCHER_VEHICLE_TYPES = ["bike", "car", "van"] as const;

export class UpdateDispatcherProfileDto {
  @ApiProperty({ enum: DISPATCHER_VEHICLE_TYPES, required: false })
  @IsOptional()
  @IsIn(DISPATCHER_VEHICLE_TYPES)
  vehicleType?: (typeof DISPATCHER_VEHICLE_TYPES)[number];

  @ApiProperty({ required: false, example: "AS-1234-21" })
  @IsOptional()
  @IsString()
  @Matches(/^\s*[A-Za-z0-9][A-Za-z0-9 -]{1,18}[A-Za-z0-9]\s*$/, {
    message: "plateNumber must be 3-20 letters, numbers, spaces or dashes",
  })
  plateNumber?: string;
}

export class ToggleStatusDto {
  @ApiProperty({ enum: ["ONLINE", "OFFLINE"] })
  @IsIn(["ONLINE", "OFFLINE"])
  status: "ONLINE" | "OFFLINE";
}

export class UpdateLocationDto {
  @ApiProperty()
  @IsNumber()
  lat: number;

  @ApiProperty()
  @IsNumber()
  lng: number;
}

export class UpdateTaskStatusDto {
  @ApiProperty({
    enum: ["EN_ROUTE_PICKUP", "ARRIVED_PICKUP", "PICKED_UP", "EN_ROUTE_DROPOFF", "DELIVERED"],
  })
  @IsIn(["EN_ROUTE_PICKUP", "ARRIVED_PICKUP", "PICKED_UP", "EN_ROUTE_DROPOFF", "DELIVERED"])
  status: string;
}
