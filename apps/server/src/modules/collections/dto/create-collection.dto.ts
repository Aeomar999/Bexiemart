import { IsString, IsNotEmpty, IsOptional, MaxLength } from "class-validator";

export class CreateCollectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
