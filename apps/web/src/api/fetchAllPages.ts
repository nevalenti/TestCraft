import type { Paginated } from "@testcraft/types";

export const fetchAllPages = async <T>(
  fetchPage: (page: number) => Promise<Paginated<T>>,
): Promise<Paginated<T>> => {
  const first = await fetchPage(1);
  const pageCount = Math.ceil(first.total / first.page_size);
  if (pageCount <= 1) return first;

  const items = [...first.items];
  for (let start = 2; start <= pageCount; start += 4) {
    const pages = await Promise.all(
      Array.from({ length: Math.min(4, pageCount - start + 1) }, (_, index) =>
        fetchPage(start + index),
      ),
    );
    for (const page of pages) items.push(...page.items);
  }

  return { ...first, items };
};
