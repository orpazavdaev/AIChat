import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AskQuestionDto } from './dto/ask-question.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  createConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(user.userId, dto);
  }

  @Get('conversations')
  findConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.findConversations(user.userId);
  }

  @Get('conversations/:id/messages')
  findMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.findMessages(user.userId, conversationId);
  }

  @Post('conversations/:id/messages')
  addMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') conversationId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.addMessage(user.userId, conversationId, dto);
  }

  @Post('conversations/:id/ask')
  ask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') conversationId: string,
    @Body() dto: AskQuestionDto,
  ) {
    return this.chatService.ask(user.userId, conversationId, dto.question);
  }
}
