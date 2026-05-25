export type ChunkTextOptions = {
  chunkSize?: number;
  overlap?: number;
};

export type TextChunk = {
  index: number;
  content: string;
  pageNumber?: number;
};

export type PagedTextInput = {
  pageNumber: number;
  text: string;
};

const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_OVERLAP = 150;

export function chunkText(
  text: string,
  options: ChunkTextOptions = {},
): TextChunk[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;
  const normalized = text.trim();

  if (!normalized) {
    return [];
  }

  if (normalized.length <= chunkSize) {
    return [{ index: 0, content: normalized }];
  }

  const step = Math.max(chunkSize - overlap, 1);
  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    chunks.push({
      index: chunks.length,
      content: normalized.slice(start, end),
    });

    if (end >= normalized.length) {
      break;
    }

    start += step;
  }

  return chunks;
}

export function chunkPagedText(
  pages: PagedTextInput[],
  options: ChunkTextOptions = {},
): TextChunk[] {
  const chunks: TextChunk[] = [];

  for (const page of pages) {
    const pageChunks = chunkText(page.text, options);

    for (const pageChunk of pageChunks) {
      chunks.push({
        index: chunks.length,
        content: pageChunk.content,
        pageNumber: page.pageNumber,
      });
    }
  }

  return chunks;
}
