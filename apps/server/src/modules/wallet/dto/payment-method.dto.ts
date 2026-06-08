import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AddCardPaymentMethodDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  details: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  expiry: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  holderName?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class AddMomoPaymentMethodDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  details: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  holderName?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
