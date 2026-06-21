import { IsDateString, IsString } from "class-validator";

export class CreateFlashSaleDto {
  @IsString()
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
