import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listWebhookSubscriptions: vi.fn(),
  createWebhookSubscription: vi.fn(),
  deleteWebhookSubscription: vi.fn(),
  listEmailSubscriptions: vi.fn(),
  createEmailSubscription: vi.fn(),
  deleteEmailSubscription: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { notificationsApi } from "@/features/notifications/api";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("notificationsApi webhooks", () => {
  it("getWebhooks fetches the webhook list", async () => {
    vi.mocked(sdk.listWebhookSubscriptions).mockResolvedValue({
      data: [],
    } as never);

    await notificationsApi.getWebhooks("p1");

    expect(sdk.listWebhookSubscriptions).toHaveBeenCalledWith({
      path: { project_id: "p1" },
    });
  });

  it("createWebhook posts under the webhooks path, not the emails path", async () => {
    vi.mocked(sdk.createWebhookSubscription).mockResolvedValue({
      data: { id: "w1" },
    } as never);

    await notificationsApi.createWebhook("p1", { url: "https://x" } as any);

    expect(sdk.createWebhookSubscription).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      body: { url: "https://x" },
    });
  });

  it("deleteWebhook removes the webhook by id", () => {
    notificationsApi.deleteWebhook("p1", "w1");

    expect(sdk.deleteWebhookSubscription).toHaveBeenCalledWith({
      path: { project_id: "p1", subscription_id: "w1" },
    });
  });
});

describe("notificationsApi emails", () => {
  it("getEmails fetches the email subscription list", async () => {
    vi.mocked(sdk.listEmailSubscriptions).mockResolvedValue({
      data: [],
    } as never);

    await notificationsApi.getEmails("p1");

    expect(sdk.listEmailSubscriptions).toHaveBeenCalledWith({
      path: { project_id: "p1" },
    });
  });

  it("createEmail posts under the emails path, not the webhooks path", async () => {
    vi.mocked(sdk.createEmailSubscription).mockResolvedValue({
      data: { id: "e1" },
    } as never);

    await notificationsApi.createEmail("p1", {
      email: "a@b.com",
    } as any);

    expect(sdk.createEmailSubscription).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      body: { email: "a@b.com" },
    });
  });

  it("deleteEmail removes the email subscription by id", () => {
    notificationsApi.deleteEmail("p1", "e1");

    expect(sdk.deleteEmailSubscription).toHaveBeenCalledWith({
      path: { project_id: "p1", subscription_id: "e1" },
    });
  });
});
