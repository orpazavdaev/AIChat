import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DocumentsModule } from '../documents/documents.module';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';
import { RagChatService } from './rag/rag-chat.service';

@Module({
  imports: [AuthModule, DocumentsModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository, RagChatService],
  exports: [ChatService],
})
export class ChatModule {}
