import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class DayHoursDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  day: number;

  @IsBoolean()
  isOpen: boolean;

  @IsOptional()
  @IsString()
  openTime?: string;

  @IsOptional()
  @IsString()
  closeTime?: string;
}

export class UpdateHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayHoursDto)
  hours: DayHoursDto[];
}
