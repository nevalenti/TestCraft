import { z } from "zod";

import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "@/domain/pagination";

export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .catch(DEFAULT_PAGE)
    .default(DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(500)
    .catch(DEFAULT_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});
