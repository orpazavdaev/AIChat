export type RagContextChunk = {
  sourceId: string;
  documentFilename: string;
  pageNumber: number;
  content: string;
};

export type RagPrompt = {
  system: string;
  user: string;
};

const NO_CONTEXT_ANSWER =
  "I don't have enough information in the provided documents to answer that question.";

export function buildRagPrompt(
  question: string,
  chunks: RagContextChunk[],
): RagPrompt {
  const contextBlock = chunks
    .map(
      (chunk) =>
        `[${chunk.sourceId}] (document: ${chunk.documentFilename}, page ${chunk.pageNumber})\n${chunk.content}`,
    )
    .join('\n\n');

  const system = [
    'You answer questions using ONLY the context below.',
    'If the answer is not supported by the context, reply with exactly:',
    `"${NO_CONTEXT_ANSWER}"`,
    'Do not use outside knowledge. Do not invent facts.',
    'When you use information from the context, cite the source using [source-N] notation.',
    '',
    'Context:',
    contextBlock,
  ].join('\n');

  return {
    system,
    user: question,
  };
}

export function buildNoContextAnswer(): string {
  return NO_CONTEXT_ANSWER;
}
