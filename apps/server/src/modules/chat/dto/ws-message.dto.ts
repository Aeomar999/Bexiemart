import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsArray,
  IsBoolean,
  IsMongoId,
} from "class-validator";

export class WsPresenceSubscriptionDto {
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}

export class WsConversationJoinDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;
}

export class WsSendMessageDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @IsIn(["TEXT", "IMAGE"])
  type?: "TEXT" | "IMAGE";

  @IsOptional()
  @IsString()
  mediaUrl?: string;
}

export class WsTypingDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsBoolean()
  isTyping: boolean;
}

export class WsMessageReadDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;
}
