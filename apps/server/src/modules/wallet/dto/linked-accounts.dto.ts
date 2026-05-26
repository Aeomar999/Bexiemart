import { IsString, IsNotEmpty, IsOptional, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LinkBankAccountDto {
  @ApiProperty({ description: "Paystack bank code (e.g. 044 for Access Bank)" })
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @ApiProperty({ description: "Bank account number" })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ description: "Account holder name" })
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @ApiProperty({ description: "Bank name for display", required: false })
  @IsString()
  @IsOptional()
  bankName?: string;
}

export enum MomoProvider {
  MTN = "MTN",
  VODAFONE = "VODAFONE",
  AIRTELTIGO = "AIRTELTIGO",
}

export class LinkMomoAccountDto {
  @ApiProperty({ enum: MomoProvider, description: "Mobile money provider" })
  @IsEnum(MomoProvider)
  @IsNotEmpty()
  provider: MomoProvider;

  @ApiProperty({ description: "Phone number linked to the mobile money account" })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: "Account holder name" })
  @IsString()
  @IsNotEmpty()
  accountName: string;
}

export class ResolveBankAccountDto {
  @ApiProperty({ description: "Paystack bank code" })
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @ApiProperty({ description: "Bank account number to resolve" })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;
}
