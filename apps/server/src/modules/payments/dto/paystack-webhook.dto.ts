import { IsObject, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PaystackWebhookDto {
  @ApiProperty({ description: "Paystack event payload" })
  @IsObject()
  @IsNotEmpty()
  event!: string;

  @ApiProperty({ description: "Paystack event data" })
  @IsObject()
  @IsNotEmpty()
  data!: Record<string, unknown>;
}
