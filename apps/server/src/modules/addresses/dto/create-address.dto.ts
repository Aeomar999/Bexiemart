import { IsString, IsOptional, IsBoolean } from "class-validator";

export class CreateAddressDto {
  @IsString()
  type: string;

  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
