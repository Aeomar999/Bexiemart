import { IsString, IsEmail, IsOptional, IsArray, IsBoolean } from "class-validator";

export class CreateStaffDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString() role: string;
  @IsOptional() @IsArray() permissions?: string[];
}

export class UpdateStaffDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsArray() permissions?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}
