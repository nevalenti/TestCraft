import type { Paginated, TestCase } from "@testcraft/types";
import { AxiosHeaders, type AxiosResponse } from "axios";

export const makeTestCase = (overrides: Partial<TestCase> = {}): TestCase => ({
  id: "case-1",
  version: 1,
  suite_id: "suite-1",
  name: "Login test",
  description: "",
  priority: "medium",
  step_count: 0,
  labels: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

export const paginated = <T>(items: T[]): Paginated<T> => ({
  items,
  total: items.length,
  page: 1,
  page_size: 100,
});

export const apiResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: { headers: new AxiosHeaders() },
});
