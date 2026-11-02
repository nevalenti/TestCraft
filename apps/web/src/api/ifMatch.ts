import { isAxiosError } from "axios";

const PRECONDITION_FAILED = 412;

export const ifMatch = (version: number) => ({ "if-match": `"${version}"` });

export const isPreconditionFailed = (error: unknown) =>
  isAxiosError(error) && error.response?.status === PRECONDITION_FAILED;
