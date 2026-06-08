import { IsString, IsNotEmpty, IsOptional, MaxLength, IsUrl } from "class-validator";

export class CreateStoryDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({ protocols: ["https"] })
  mediaUrl: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  caption?: string;
}
