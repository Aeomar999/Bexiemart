import { IsString, IsOptional } from "class-validator";

export class CreateReelDto {
  @IsString() videoUrl: string;
  @IsOptional() @IsString() thumbnailUrl?: string;
  @IsOptional() @IsString() caption?: string;
  @IsOptional() @IsString() productId?: string;
}

export class UpdateReelDto {
  @IsOptional() @IsString() caption?: string;
  @IsOptional() @IsString() thumbnailUrl?: string;
}
