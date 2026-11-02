import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiResponse, makeTestCase, paginated } from "@/__tests__/fixtures";
import { createWrapper } from "@/__tests__/test-utils";
import { queryKeys } from "@/api/queryKeys";
import { testCaseQueries, testCasesApi } from "@/features/testCases/api";
import {
  useCreateTestCase,
  useDeleteTestCase,
  useProjectTestCases,
  useTestCase,
  useTestCases,
  useUpdateTestCase,
} from "@/features/testCases/hooks";
import { notify } from "@/lib/notify";

vi.mock("@/api/client", () => ({ apiClient: {} }));
vi.mock("@/lib/notify", () => ({ notify: vi.fn() }));

afterEach(() => vi.restoreAllMocks());

const setupCatalog = () => {
  const context = createWrapper();
  context.queryClient.setDefaultOptions({
    queries: { retry: false, staleTime: Infinity },
  });
  const original = makeTestCase();
  let items = [original];
  vi.spyOn(testCasesApi, "getAll").mockImplementation(async () =>
    paginated(items),
  );
  vi.spyOn(testCasesApi, "getAllByProject").mockImplementation(async () =>
    paginated(items),
  );
  vi.spyOn(testCasesApi, "getById").mockImplementation(async () => items[0]);
  const queries = renderHook(
    () => ({
      suite: useTestCases("project-1", "suite-1", "Login"),
      project: useProjectTestCases("project-1"),
      detail: useTestCase("project-1", "suite-1", original.id),
    }),
    { wrapper: context.wrapper },
  );
  return {
    ...context,
    queries,
    original,
    changeItems: (next: typeof items) => {
      items = next;
    },
  };
};

describe("test-case query lifecycle", () => {
  it("exposes loading and returns the case catalog and detail", async () => {
    const { queries, original } = setupCatalog();
    expect(queries.result.current.suite.isPending).toBe(true);
    await waitFor(() =>
      expect(queries.result.current.suite.data).toEqual([original]),
    );
    expect(queries.result.current.project.data).toEqual([original]);
    expect(queries.result.current.detail.data).toEqual(original);
  });

  it("exposes an error when the catalog request fails", async () => {
    vi.spyOn(testCasesApi, "getAll").mockRejectedValue(new Error("offline"));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTestCases("project-1", "suite-1"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("offline");
  });

  it("refreshes the suite and project picker after creating a case", async () => {
    const context = setupCatalog();
    await waitFor(() =>
      expect(context.queries.result.current.project.isSuccess).toBe(true),
    );
    const added = makeTestCase({ id: "case-2", name: "Second login test" });
    vi.spyOn(testCasesApi, "create").mockImplementation(async () => {
      context.changeItems([context.original, added]);
      return added;
    });
    const { result } = renderHook(
      () => useCreateTestCase("project-1", "suite-1"),
      { wrapper: context.wrapper },
    );
    await act(() => result.current.mutateAsync({ name: added.name }));
    await waitFor(() =>
      expect(context.queries.result.current.project.data).toEqual([
        context.original,
        added,
      ]),
    );
    expect(context.queries.result.current.suite.data).toEqual([
      context.original,
      added,
    ]);
  });

  it("refreshes lists, details and plan projections after renaming a case", async () => {
    const context = setupCatalog();
    await waitFor(() =>
      expect(context.queries.result.current.detail.isSuccess).toBe(true),
    );
    const planKey = queryKeys.testPlans.cases("project-1", "plan-1");
    const resultKey = queryKeys.testResults.all("project-1", "run-1");
    context.queryClient.setQueryData(resultKey, paginated([]));
    const otherProject = testCaseQueries.byProject("project-2").queryKey;
    context.queryClient.setQueryData(planKey, []);
    context.queryClient.setQueryData(otherProject, paginated([]));
    const updated = makeTestCase({ name: "Renamed login" });
    vi.spyOn(testCasesApi, "update").mockImplementation(async () => {
      context.changeItems([updated]);
      return updated;
    });
    const { result } = renderHook(
      () => useUpdateTestCase("project-1", "suite-1"),
      { wrapper: context.wrapper },
    );
    await act(() =>
      result.current.mutateAsync({
        id: updated.id,
        version: updated.version,
        name: updated.name,
        priority: "medium",
      }),
    );
    await waitFor(() =>
      expect(context.queries.result.current.detail.data).toEqual(updated),
    );
    expect(context.queries.result.current.suite.data).toEqual([updated]);
    expect(context.queries.result.current.project.data).toEqual([updated]);
    expect(context.queryClient.getQueryState(planKey)?.isInvalidated).toBe(
      true,
    );
    expect(context.queryClient.getQueryState(resultKey)?.isInvalidated).toBe(
      true,
    );
    expect(context.queryClient.getQueryState(otherProject)?.isInvalidated).toBe(
      false,
    );
  });

  it("finds the deleted name in a searched list and removes cached descendants", async () => {
    const { queryClient, wrapper } = createWrapper();
    const original = makeTestCase();
    queryClient.setQueryData(
      testCaseQueries.all("project-1", "suite-1", "Login").queryKey,
      paginated([original]),
    );
    queryClient.setQueryData(
      testCaseQueries.byProject("project-1").queryKey,
      paginated([original]),
    );
    const detailKey = testCaseQueries.detail(
      "project-1",
      "suite-1",
      original.id,
    ).queryKey;
    queryClient.setQueryData(detailKey, original);
    queryClient.setQueryData([...detailKey, "steps"], paginated([]));
    vi.spyOn(testCasesApi, "delete").mockResolvedValue(apiResponse(undefined));
    const { result } = renderHook(
      () => useDeleteTestCase("project-1", "suite-1"),
      { wrapper },
    );
    await act(() => result.current.mutateAsync(original.id));
    expect(notify).toHaveBeenCalledWith('Test case "Login test" deleted');
    expect(queryClient.getQueryData(detailKey)).toBeUndefined();
    expect(queryClient.getQueryData([...detailKey, "steps"])).toBeUndefined();
    expect(
      queryClient.getQueryState(testCaseQueries.byProject("project-1").queryKey)
        ?.isInvalidated,
    ).toBe(true);
  });

  it("preserves fresh caches and reports failure when a mutation rejects", async () => {
    vi.mocked(notify).mockClear();
    const { queryClient, wrapper } = createWrapper();
    const key = testCaseQueries.byProject("project-1").queryKey;
    queryClient.setQueryData(key, paginated([makeTestCase()]));
    vi.spyOn(testCasesApi, "create").mockRejectedValue(new Error("offline"));
    const { result } = renderHook(
      () => useCreateTestCase("project-1", "suite-1"),
      { wrapper },
    );
    await act(async () => {
      await expect(
        result.current.mutateAsync({ name: "New case" }),
      ).rejects.toThrow("offline");
    });
    expect(result.current.isError).toBe(true);
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
    expect(notify).not.toHaveBeenCalled();
  });
});
