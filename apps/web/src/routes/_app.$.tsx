import { createFileRoute } from "@tanstack/react-router";

import { NotFound } from "@/app/NotFound";
export const Route = createFileRoute("/_app/$")({
  component: NotFound,
});
