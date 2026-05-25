'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Document } from '@/types/document';
import { FileText } from 'lucide-react';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function DocumentRow({
  document,
  highlighted,
}: {
  document: Document;
  highlighted?: boolean;
}) {
  return (
    <Card
      id={`doc-${document.id}`}
      className={cn(
        'scroll-mt-24 border-border/60 py-0 shadow-none transition-shadow duration-200 hover:shadow-sm',
        highlighted && 'ring-2 ring-primary/40',
      )}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
          <FileText className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium leading-snug">{document.filename}</p>
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
            <Skeleton className="h-5 w-16 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DocumentsList({
  documents,
  isLoading,
  highlightDocumentId,
}: {
  documents: Document[];
  isLoading: boolean;
  highlightDocumentId?: string | null;
}) {
  if (isLoading) {
    return <DocumentsSkeleton />;
  }

  if (documents.length === 0) {
    return (
      <Card className="border-dashed border-border/80 bg-muted/15 py-0 shadow-none dark:bg-muted/10">
        <CardContent>
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Upload a PDF to build your knowledge base and start chatting."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <DocumentRow
          key={document.id}
          document={document}
          highlighted={highlightDocumentId === document.id}
        />
      ))}
    </div>
  );
}
