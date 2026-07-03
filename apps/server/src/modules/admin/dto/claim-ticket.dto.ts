import { IsOptional, IsString, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class ClaimTicketDto {
  @ApiPropertyOptional({ description: "Optional note when claiming" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
