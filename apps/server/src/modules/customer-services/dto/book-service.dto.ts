import { IsOptional, IsString } from "class-validator";

export class BookServiceDto {
  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  scheduledAt?: string;
}
