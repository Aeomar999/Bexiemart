import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export enum ProductSort {
  POPULAR = "popular",
  NEWEST = "newest",
  PRICE_LOW = "price-low",
  PRICE_HIGH = "price-high",
}

export class QueryProductsDto {
  @IsOptional() @IsString() category?: string;

  @IsOptional() @IsString() vendorId?: string;

  @IsOptional() @IsString() search?: string;

  @IsOptional() @IsEnum(ProductSort) sort?: ProductSort;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;

  @IsOptional() @IsString() cursor?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 20);
  }
}
