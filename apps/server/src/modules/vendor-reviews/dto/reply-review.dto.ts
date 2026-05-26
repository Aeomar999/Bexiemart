import { IsString } from "class-validator";

export class ReplyReviewDto {
  @IsString() reply: string;
}
