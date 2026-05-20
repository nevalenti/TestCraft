import { useParams } from "react-router";

export const useRequiredParam = (name: string): string => {
  const params = useParams();
  const value = params[name];
  if (!value) throw new Error(`Missing required route param: ${name}`);
  return value;
};
