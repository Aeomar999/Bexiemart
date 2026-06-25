import { IsString, IsNotEmpty, IsNumber, IsIn, IsOptional } from "class-validator";
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

export class WithdrawEarningsDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  destination: string;
}
