import { IsOptional, IsString, IsNumber, IsIn } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CheckoutFoodDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  deliveryLat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  deliveryLng?: number;

  @ApiProperty({ required: false, enum: ["bike", "car", "van"] })
  @IsOptional()
  @IsIn(["bike", "car", "van"])
  vehicleType?: "bike" | "car" | "van";
}
