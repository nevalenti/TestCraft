import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listAttachments: vi.fn(),
  uploadAttachment: vi.fn(),
  getAttachmentDownloadUrl: vi.fn(),
  deleteAttachment: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { attachmentsApi } from "@/features/attachments/api";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("attachmentsApi", () => {
  it("getPage fetches one page of attachments for the result", async () => {
    vi.mocked(sdk.listAttachments).mockResolvedValue({
      data: { items: [], total: 0, page: 2, page_size: 20 },
    } as never);

    await attachmentsApi.getPage("p1", "r1", "res1", 2);

    expect(sdk.listAttachments).toHaveBeenCalledWith({
      path: { project_id: "p1", run_id: "r1", result_id: "res1" },
      query: { page: 2, page_size: 20 },
    });
  });

  it("upload posts a multipart form with the file", async () => {
    vi.mocked(sdk.uploadAttachment).mockResolvedValue({
      data: { id: "a1" },
    } as never);
    const file = new File(["x"], "log.txt", { type: "text/plain" });

    await attachmentsApi.upload("p1", "r1", "res1", file);

    expect(sdk.uploadAttachment).toHaveBeenCalledWith({
      path: { project_id: "p1", run_id: "r1", result_id: "res1" },
      body: { file },
    });
    expect(vi.mocked(sdk.uploadAttachment).mock.calls[0][0]?.body).toEqual({
      file,
    });
  });

  it("getDownloadUrl returns just the url string from the response", async () => {
    vi.mocked(sdk.getAttachmentDownloadUrl).mockResolvedValue({
      data: { url: "https://cdn.example.com/a1" },
    } as never);

    const url = await attachmentsApi.getDownloadUrl("p1", "r1", "res1", "a1");

    expect(sdk.getAttachmentDownloadUrl).toHaveBeenCalledWith({
      path: {
        project_id: "p1",
        run_id: "r1",
        result_id: "res1",
        attachment_id: "a1",
      },
    });
    expect(url).toBe("https://cdn.example.com/a1");
  });

  it("delete removes the attachment by id", () => {
    attachmentsApi.delete("p1", "r1", "res1", "a1");

    expect(sdk.deleteAttachment).toHaveBeenCalledWith({
      path: {
        project_id: "p1",
        run_id: "r1",
        result_id: "res1",
        attachment_id: "a1",
      },
    });
  });
});
