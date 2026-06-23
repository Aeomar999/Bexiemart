import { IsString, IsArray, ValidateNested, IsOptional, IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";

export class ShippingAddressDto {
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsString() phone: string;
  @IsString() email: string;
  @IsString() address: string;
  @IsString() city: string;
  @IsString() state: string;
  @IsOptional() @IsString() zipCode?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() instructions?: string;
  // Dropoff coordinates (from the map / GPS). When present, delivery is priced
  // by real distance; otherwise the address is geocoded server-side.
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
}

export class CreateOrderItemDto {
  @IsString() productId: string;
  @IsNumber() @Min(1) quantity: number;
  @IsNumber() price: number;
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];
}
