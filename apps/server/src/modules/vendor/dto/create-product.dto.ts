import { IsString, IsNumber, IsOptional, Min, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class ProductImageDto {
  @IsString()
  url: string;

  @IsOptional()
  isPrimary?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];
}
