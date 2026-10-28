import { IsString, IsNotEmpty } from "class-validator";

export class RevokeSessionDto {
  @IsString()
  @IsNotEmpty({ message: "Session ID is required" })
  sessionId: string;
}
