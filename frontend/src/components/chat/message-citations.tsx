'use client';

import { cn } from '@/lib/utils';
import { bidiTextProps } from '@/lib/text-direction';
import type { RagCitation } from '@/types/chat';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function MessageCitations({
  citations,
  activeSourceRef,
  onSourceSelect,
}: {
  citations: RagCitation[];
  activeSourceRef?: string | null;
  onSourceSelect?: (sourceRef: string) => void;
}) {
  const [expandedRef, setExpandedRef] = useState<string | null>(null);

  if (citations.length === 0) {
    return null;
  }

  const handleSelect = (citation: RagCitation) => {
    setExpandedRef((current) =>
      current === citation.sourceRef ? null : citation.sourceRef,
    );
    onSourceSelect?.(citation.sourceRef);
  };

  return (
    <div className="mt-3 border-t border-border/50 pt-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Sources
      </p>
      <ul className="mt-2 space-y-1">
        {citations.map((citation) => {
          const isActive =
            activeSourceRef === citation.sourceRef ||
            expandedRef === citation.sourceRef;

          return (
            <li key={citation.chunkId}>
              <div
                className={cn(
                  'rounded-lg border border-transparent transition-colors',
                  isActive && 'border-primary/25 bg-primary/5',
                )}
              >
                <div className="flex items-start gap-1">
                  <button
                    type="button"
                    onClick={() => handleSelect(citation)}
                    className="flex min-w-0 flex-1 items-start gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-muted/60"
                  >
                    <span
                      dir="ltr"
                      className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary"
                    >
                      [{citation.sourceIndex}]
                    </span>
                    <span {...bidiTextProps('min-w-0 leading-relaxed')}>
                      <span className="font-medium text-foreground">
                        {citation.documentFilename}
                      </span>
                      <span className="text-muted-foreground">
                        {' '}
                        · Page {citation.pageNumber}
                      </span>
                    </span>
                  </button>
                  <Link
                    href={`/documents?doc=${citation.documentId}`}
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                    aria-label={`Open ${citation.documentFilename}`}
                    title="Open document"
                  >
                    <FileText className="size-3.5" />
                  </Link>
                </div>
                {isActive && (
                  <p {...bidiTextProps('px-2 pb-2 text-[11px] leading-relaxed text-muted-foreground')}>
                    {citation.excerpt}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
