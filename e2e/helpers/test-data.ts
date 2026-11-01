import { randomUUID } from "node:crypto";

import {
  type APIRequestContext,
  expect,
  type Response,
} from "@playwright/test";

export type TestResource = { id: string; name: string; path: string };

export class TestData {
  private readonly projectIds = new Set<string>();
  private readonly pending: Promise<void>[] = [];

  trackProject = (response: Response) => {
    if (
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/v1/projects" &&
      response.status() === 201
    ) {
      this.pending.push(
        (async () => {
          const project = (await response.json()) as { id: string };
          this.projectIds.add(project.id);
        })(),
      );
    }
  };

  constructor(private readonly api: APIRequestContext) {}

  private async create(
    path: string,
    body: Record<string, string>,
  ): Promise<{ id: string; name: string }> {
    const response = await this.api.post(`/api/v1${path}`, { data: body });
    expect(response.status(), `Create ${path}`).toBe(201);
    return response.json();
  }

  async createProject(
    name = `E2E Project ${randomUUID()}`,
  ): Promise<TestResource> {
    const project = await this.create("/projects", { name });
    this.projectIds.add(project.id);
    return { ...project, path: `/projects/${project.id}/runs` };
  }

  async createSuite(
    projectId: string,
    name = `E2E Suite ${randomUUID()}`,
  ): Promise<TestResource> {
    const suite = await this.create(`/projects/${projectId}/suites`, { name });
    return { ...suite, path: `/projects/${projectId}/suites/${suite.id}` };
  }

  async createCase(
    projectId: string,
    suiteId: string,
    name = `E2E Case ${randomUUID()}`,
  ): Promise<TestResource> {
    const testCase = await this.create(
      `/projects/${projectId}/suites/${suiteId}/cases`,
      { name },
    );
    return {
      ...testCase,
      path: `/projects/${projectId}/suites/${suiteId}/cases/${testCase.id}`,
    };
  }

  async createRun(
    projectId: string,
    name = `E2E Run ${randomUUID()}`,
  ): Promise<TestResource> {
    const run = await this.create(`/projects/${projectId}/runs`, {
      name,
      environment: "staging",
    });
    return { ...run, path: `/projects/${projectId}/runs/${run.id}` };
  }

  async renameSuite(projectId: string, suiteId: string, name: string) {
    const path = `/api/v1/projects/${projectId}/suites/${suiteId}`;
    const current = await this.api.get(path);
    expect(current.ok(), "Get suite before rename").toBe(true);
    const response = await this.api.put(path, {
      data: { name },
      headers: { "If-Match": current.headers()["etag"] },
    });
    expect(response.ok(), "Rename suite").toBe(true);
  }

  async runs(projectId: string): Promise<{ total: number }> {
    const response = await this.api.get(`/api/v1/projects/${projectId}/runs`);
    expect(response.ok()).toBe(true);
    return response.json();
  }

  async cleanup() {
    const tracking = await Promise.allSettled(this.pending);
    const cleanup = await Promise.allSettled(
      [...this.projectIds].map(async (id) => {
        const response = await this.api.delete(`/api/v1/projects/${id}`);
        expect([204, 404]).toContain(response.status());
        const remaining = await this.api.get(`/api/v1/projects/${id}`);
        expect(remaining.status()).toBe(404);
      }),
    );
    const errors = [...tracking, ...cleanup].filter(
      (result) => result.status === "rejected",
    );
    if (errors.length > 0)
      throw new AggregateError(
        errors.map((result) => result.reason),
        "Test project cleanup failed",
      );
  }
}
