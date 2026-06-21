import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsIn } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @IsIn(["customer", "vendor"])
  role?: string;
}
