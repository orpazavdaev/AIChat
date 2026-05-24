export type DocumentStatus = 'UPLOADED';

export interface Document {
  id: string;
  filename: string;
  path: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}
