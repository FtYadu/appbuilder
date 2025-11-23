import { z } from 'zod';

export const MemorySearchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

export const MemorySearchResultSchema = z.object({
  id: z.string(),
  entity_ref: z.string(),
  content: z.string(),
  similarity: z.number().min(0).max(1),
  provenance: z.string(),
});

export const MemorySearchResponseSchema = z.object({
  results: z.array(MemorySearchResultSchema),
  total: z.number().int().nonnegative(),
});

export type MemorySearchQuery = z.infer<typeof MemorySearchQuerySchema>;
export type MemorySearchResult = z.infer<typeof MemorySearchResultSchema>;
export type MemorySearchResponse = z.infer<typeof MemorySearchResponseSchema>;
