import type { Response } from 'express';
import type { RagSseEvent } from './rag-chat.types';

export function initSse(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
}

export function writeSseEvent(res: Response, event: RagSseEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}
