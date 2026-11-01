import { type APIRequestContext, expect } from "@playwright/test";

type Message = { ID: string; Subject: string; To: { Address: string }[] };

export async function waitForEmail(
  request: APIRequestContext,
  recipient: string,
) {
  const baseURL = process.env.MAILPIT_URL ?? "http://localhost:8025";
  let message: Message | undefined;
  await expect
    .poll(
      async () => {
        const response = await request.get(`${baseURL}/api/v1/search`, {
          params: { query: `to:${recipient}`, limit: 10 },
        });
        expect(response.ok()).toBe(true);
        const result = (await response.json()) as { messages: Message[] };
        message = result.messages.find((item) =>
          item.To.some((to) => to.Address === recipient),
        );
        return message;
      },
      {
        timeout: 45_000,
        intervals: [250, 500, 1000],
        message: `Email delivery to ${recipient}`,
      },
    )
    .toBeDefined();

  const response = await request.get(
    `${baseURL}/api/v1/message/${message!.ID}`,
  );
  expect(response.ok()).toBe(true);
  const detail = (await response.json()) as { HTML: string };
  return { ...message!, html: detail.HTML };
}
