export type DocumentStatus = 'UPLOADED' | 'READY' | 'FAILED';

export interface Document {
  id: string;
  filename: string;
  path: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}
