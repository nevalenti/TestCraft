import { createFileRoute } from "@tanstack/react-router";

import { SharePage } from "@/pages/share/SharePage";
export const Route = createFileRoute("/share/$token")({
  component: SharePage,
});
