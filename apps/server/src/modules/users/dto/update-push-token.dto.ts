import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdatePushTokenDto {
  @ApiProperty({ description: "Expo push token for notifications" })
  @IsString()
  @IsNotEmpty()
  token: string;
}
