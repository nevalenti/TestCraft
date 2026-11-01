import "@/styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/App";
import { router } from "@/app/router";
import { initErrorReporting } from "@/lib/errorReporting";
import { installGlobalErrorHandlers } from "@/lib/globalErrorHandlers";

initErrorReporting(router);
installGlobalErrorHandlers();

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
