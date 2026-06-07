import { addDays } from "date-fns";

export const setCookie = (name: string, value: string, days = 365): void => {
  const expires = addDays(new Date(), days).toUTCString();
  const secure = globalThis.location.protocol === "https:" ? "Secure;" : "";
  // eslint-disable-next-line unicorn/no-document-cookie
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;${secure}SameSite=Strict`;
};

export const getCookie = (name: string): string | null => {
  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(name + "="));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

export const removeCookie = (name: string): void => {
  // eslint-disable-next-line unicorn/no-document-cookie
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};
