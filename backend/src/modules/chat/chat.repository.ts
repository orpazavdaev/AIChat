import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}
}
