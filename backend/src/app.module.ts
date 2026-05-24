import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    UsersModule,
    DocumentsModule,
    ChatModule,
  ],
})
export class AppModule {}
