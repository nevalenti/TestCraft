import { Prisma } from "@/generated/prisma/client";

export const isNotFound = (e: unknown): boolean =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025";

export const isConstraintViolation = (e: unknown): boolean =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003";
