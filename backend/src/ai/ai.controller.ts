import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

// AI chat is restricted to MANAGER and ADMIN — members do not have access to team-wide insights
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MANAGER, Role.ADMIN)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // POST /api/ai/chat
  // Accepts a natural-language question and returns a Groq-generated reply
  // grounded in live team report data
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  chat(@Body() dto: ChatMessageDto) {
    return this.aiService.chat(dto.message);
  }
}
