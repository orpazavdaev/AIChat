'use client';

import { DocumentsList } from '@/components/documents/documents-list';
import { PdfUpload } from '@/components/documents/pdf-upload';
import { AppHeader } from '@/components/layout/app-header';
import { useDocuments } from '@/hooks/use-documents';

export function DocumentsPageContent() {
  const { documents, isLoading } = useDocuments();

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
            <p className="text-sm text-muted-foreground">
              All PDFs uploaded to your account
            </p>
          </header>
          <DocumentsList documents={documents} isLoading={isLoading} />
        </section>
      </section>
    </>
  );
}
