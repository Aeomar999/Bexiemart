import { IsIn, IsString } from "class-validator";

export class UpdateDispatcherStatusDto {
  @IsString()
  @IsIn(["OFFLINE", "ONLINE", "BUSY"])
  status: string;
}
