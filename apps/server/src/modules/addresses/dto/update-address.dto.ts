import { IsString, IsOptional, IsBoolean } from "class-validator";

export class UpdateAddressDto {
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}
