import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SUPPORT_CATEGORIES, SupportCategory } from "../support.constants";

export class CreateTicketDto {
  @ApiProperty({ enum: SUPPORT_CATEGORIES })
  @IsIn(SUPPORT_CATEGORIES as unknown as string[])
  category: SupportCategory;

  @ApiProperty({ minLength: 3, maxLength: 200 })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject: string;

  @ApiPropertyOptional({ description: "Optional order to link to the ticket" })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: "Optional first message from the customer" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @ApiPropertyOptional({ description: "Optional image attached to the first message" })
  @IsOptional()
  @IsString()
  mediaUrl?: string;
}
