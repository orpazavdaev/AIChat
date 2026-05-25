'use client';

import { DocumentsList } from '@/components/documents/documents-list';
import { PdfUpload } from '@/components/documents/pdf-upload';
import { AppHeader } from '@/components/layout/app-header';
import { AlertBanner } from '@/components/ui/alert-banner';
import { useDocuments } from '@/hooks/use-documents';

export function DocumentsPageContent() {
  const { documents, isLoading, isError, refetch } = useDocuments();

  return (
    <>
      <AppHeader
        title="Documents"
        description="Upload PDFs to your workspace."
      />
      <section className="space-y-8 p-8">
        <PdfUpload />
        <section className="space-y-4">
          <header>
            <h2 className="text-lg font-semibold tracking-tight">Your files</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              All PDFs uploaded to your account
            </p>
          </header>
          {isError && (
            <AlertBanner
              message="Could not load your documents."
              onRetry={() => void refetch()}
            />
          )}
          <DocumentsList
            documents={documents}
            isLoading={isLoading && !isError}
          />
        </section>
      </section>
    </>
  );
}
