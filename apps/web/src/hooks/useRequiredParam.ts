import { useParams } from "@tanstack/react-router";

export const useRequiredParam = (name: string): string => {
  const params = useParams({ strict: false });
  const value = (params as Record<string, string>)[name];
  if (!value) throw new Error(`Missing required route param: ${name}`);
  return value;
};
