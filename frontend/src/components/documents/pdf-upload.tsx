'use client';

import { AlertBanner } from '@/components/ui/alert-banner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDocuments } from '@/hooks/use-documents';
import { cn } from '@/lib/utils';
import { FileUp, Loader2, Upload } from 'lucide-react';
import { DragEvent, useRef, useState } from 'react';

const MAX_FILE_SIZE_MB = 10;

function isPdf(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function PdfUpload() {
  const { upload } = useDocuments();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isUploading = upload.isPending;

  const validateFile = (file: File) => {
    if (!isPdf(file)) {
      return 'Only PDF files are allowed';
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File must be under ${MAX_FILE_SIZE_MB}MB`;
    }
    return null;
  };

  const handleFile = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) {
      return;
    }

    setProgress(0);
    setError(null);

    try {
      await upload.mutateAsync({
        file: selectedFile,
        onProgress: setProgress,
      });
      setSelectedFile(null);
      setProgress(0);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setProgress(0);
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="space-y-5 p-6">
        <section
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border/80 bg-muted/20 hover:border-primary/40',
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Upload className="size-6" />
          </span>
          <article className="space-y-1">
            <p className="font-medium">Drag and drop your PDF here</p>
            <p className="text-sm text-muted-foreground">
              or browse from your computer (max {MAX_FILE_SIZE_MB}MB)
            </p>
          </article>
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            <FileUp className="size-4" />
            Choose file
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                handleFile(file);
              }
            }}
          />
        </section>

        {selectedFile && (
          <section className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <header className="flex items-center justify-between gap-3">
              <article className="min-w-0">
                <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </article>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload PDF'
                )}
              </Button>
            </header>
            {isUploading && (
              <footer className="mt-4 space-y-2">
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground">{progress}% complete</p>
              </footer>
            )}
          </section>
        )}

        {error && <AlertBanner message={error} />}
      </CardContent>
    </Card>
  );
}
