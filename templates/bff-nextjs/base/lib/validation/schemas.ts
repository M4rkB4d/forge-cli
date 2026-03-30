import { z } from 'zod';

/**
 * Shared validation schemas.
 * Add feature-specific schemas here or in feature-level files.
 */

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
