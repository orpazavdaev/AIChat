'use client';

import { cn } from '@/lib/utils';
import type { RagCitation } from '@/types/chat';

const SOURCE_REF_PATTERN = /(\[source-\d+\])/gi;

export function MessageContent({
  content,
  citations,
  onSourceClick,
}: {
  content: string;
  citations?: RagCitation[];
  onSourceClick?: (sourceRef: string) => void;
}) {
  if (!citations?.length) {
    return <p className="whitespace-pre-wrap">{content}</p>;
  }

  const parts = content.split(SOURCE_REF_PATTERN);

  return (
    <p className="whitespace-pre-wrap">
      {parts.map((part, index) => {
        const match = part.match(/^\[source-(\d+)\]$/i);

        if (!match) {
          return <span key={index}>{part}</span>;
        }

        const sourceRef = `source-${match[1]}`;
        const citation = citations.find((item) => item.sourceRef === sourceRef);

        return (
          <button
            key={index}
            type="button"
            onClick={() => onSourceClick?.(sourceRef)}
            className={cn(
              'mx-0.5 inline-flex items-center rounded-md bg-primary/10 px-1 py-0.5 font-mono text-[0.85em] font-semibold text-primary underline-offset-2 transition-colors hover:bg-primary/20 hover:underline',
              citation && 'cursor-pointer',
            )}
            title={
              citation
                ? `${citation.documentFilename}, page ${citation.pageNumber}`
                : sourceRef
            }
          >
            {part}
          </button>
        );
      })}
    </p>
  );
}
