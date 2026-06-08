import { IsString, IsNotEmpty } from "class-validator";

export class AddCollectionItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;
}
