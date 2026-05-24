import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { DocumentsService } from './documents.service';

const maxFileSizeMb = parseInt(process.env.MAX_FILE_SIZE_MB ?? '10', 10);

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: maxFileSizeMb * 1024 * 1024,
      },
    }),
  )
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.upload(user.userId, file);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.findAllByUser(user.userId);
  }
}
