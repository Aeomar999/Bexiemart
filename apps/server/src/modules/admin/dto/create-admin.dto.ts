import { IsEmail, IsString, MinLength, MaxLength } from "class-validator";

export class CreateAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  // Initial password set by the super admin; the new admin should change it
  // after first login. Min length mirrors the platform's auth password policy.
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
