import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { extname, join } from 'path';

@Injectable()
export class FileStorageService {
  private readonly uploadDir: string;
  private readonly maxFileSizeBytes: number;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.getOrThrow<string>('storage.uploadDir');
    const maxFileSizeMb = this.configService.getOrThrow<number>(
      'storage.maxFileSizeMb',
    );
    this.maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;
  }

  async save(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ filename: string; path: string }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.size > this.maxFileSizeBytes) {
      throw new PayloadTooLargeException(
        `File exceeds maximum size of ${this.maxFileSizeBytes / (1024 * 1024)}MB`,
      );
    }

    const extension = extname(file.originalname).toLowerCase();
    if (file.mimetype !== 'application/pdf' || extension !== '.pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    const storedFilename = `${randomUUID()}.pdf`;
    const relativePath = join(userId, storedFilename);
    const absolutePath = join(process.cwd(), this.uploadDir, relativePath);

    await mkdir(join(process.cwd(), this.uploadDir, userId), {
      recursive: true,
    });
    await writeFile(absolutePath, file.buffer);

    return {
      filename: file.originalname,
      path: relativePath.replace(/\\/g, '/'),
    };
  }

  getAbsolutePath(relativePath: string): string {
    return join(process.cwd(), this.uploadDir, relativePath);
  }

  read(relativePath: string): Promise<Buffer> {
    return readFile(this.getAbsolutePath(relativePath));
  }
}
