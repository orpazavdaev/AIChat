import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule, AiModule],
  exports: [ConfigModule, DatabaseModule, AiModule],
})
export class CommonModule {}
