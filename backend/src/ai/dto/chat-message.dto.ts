import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Body accepted by POST /ai/chat
export class ChatMessageDto {
  // Cap at 1000 characters to prevent prompt stuffing / abuse
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;
}
