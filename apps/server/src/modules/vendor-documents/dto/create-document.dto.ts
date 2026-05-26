import { IsString } from "class-validator";

export class CreateDocumentDto {
  @IsString()
  name: string;

  @IsString()
  url: string;

  @IsString()
  type: string;
}
