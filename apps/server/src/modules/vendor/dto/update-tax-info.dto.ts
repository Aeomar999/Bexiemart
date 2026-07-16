import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateTaxInfoDto {
  @ApiProperty({ description: "Tax Identification Number (TIN)" })
  @IsString()
  @IsNotEmpty()
  tin: string;
}
