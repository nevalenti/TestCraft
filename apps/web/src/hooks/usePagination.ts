import { useState } from 'react';

import { TABLE_PAGE_SIZE } from '@/lib/constants';

export const usePagination = <T>(
  items: T[],
  pageSize: number = TABLE_PAGE_SIZE,
) => {
  const [rawPage, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(rawPage, pageCount - 1);
  const pageItems = items.slice(page * pageSize, (page + 1) * pageSize);

  return { page, setPage, pageCount, pageItems };
};
