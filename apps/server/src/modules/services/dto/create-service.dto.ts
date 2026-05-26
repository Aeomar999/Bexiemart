import { IsString, IsNumber, Min, IsOptional } from "class-validator";

export class CreateServiceDto {
  @IsString() name: string;
  @IsString() description: string;
  @IsNumber() @Min(0) price: number;
  @IsOptional() @IsString() priceDisplay?: string;
  @IsString() imageUrl: string;
  @IsString() category: string;
}

export class UpdateServiceDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsString() priceDisplay?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() category?: string;
}
