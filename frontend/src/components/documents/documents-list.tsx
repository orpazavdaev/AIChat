'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Document } from '@/types/document';
import { FileText } from 'lucide-react';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function DocumentRow({ document }: { document: Document }) {
  return (
    <Card className="border-border/60 py-0 shadow-none">
      <CardContent className="flex items-center gap-4 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileText className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{document.filename}</p>
          <p className="text-xs text-muted-foreground">
            Uploaded {formatDate(document.createdAt)}
          </p>
        </div>
        <Badge variant="secondary">{document.status}</Badge>
      </CardContent>
    </Card>
  );
}

function DocumentsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="border-border/60 py-0 shadow-none">
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="size-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DocumentsList({
  documents,
  isLoading,
}: {
  documents: Document[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <DocumentsSkeleton />;
  }

  if (documents.length === 0) {
    return (
      <Card className="border-dashed border-border/80 bg-muted/20 py-12 shadow-none">
        <CardContent className="flex flex-col items-center gap-2 text-center">
          <FileText className="size-8 text-muted-foreground" />
          <p className="font-medium">No documents yet</p>
          <p className="text-sm text-muted-foreground">
            Upload a PDF to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <DocumentRow key={document.id} document={document} />
      ))}
    </div>
  );
}
