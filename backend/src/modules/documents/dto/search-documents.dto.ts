import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SearchDocumentsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  query: string;

  @IsOptional()
  @IsUUID()
  documentId?: string;
}
