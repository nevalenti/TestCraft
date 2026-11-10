import { z } from "zod";

export const defectUrlSchema = z
  .string()
  .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), {
    message: "Enter a link starting with http:// or https://",
  });

export const DEFECT_URL_PLACEHOLDER = "https://github.com/org/repo/issues/123";
