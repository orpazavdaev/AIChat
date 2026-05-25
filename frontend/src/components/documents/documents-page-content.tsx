'use client';

import { DocumentsList } from '@/components/documents/documents-list';
import { PdfUpload } from '@/components/documents/pdf-upload';
import { AppHeader } from '@/components/layout/app-header';
import { AlertBanner } from '@/components/ui/alert-banner';
import { useDocuments } from '@/hooks/use-documents';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function DocumentsPageContent() {
  const { documents, isLoading, isError, refetch } = useDocuments();
  const searchParams = useSearchParams();
  const highlightDocumentId = searchParams.get('doc');

  useEffect(() => {
    if (!highlightDocumentId) {
      return;
    }

    const element = globalThis.document.getElementById(
      `doc-${highlightDocumentId}`,
    );
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightDocumentId, documents]);

  return (
    <>
      <AppHeader
        title="Documents"
        description="Upload PDFs to your workspace."
      />
      <section className="space-y-8 p-4 sm:p-6 lg:p-8">
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
            highlightDocumentId={highlightDocumentId}
          />
        </section>
      </section>
    </>
  );
}
