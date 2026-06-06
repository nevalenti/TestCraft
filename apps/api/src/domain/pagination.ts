import { PaginationParams } from "@testcraft/types";

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 50;

export const resolvePagination = (pagination?: PaginationParams) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
};
