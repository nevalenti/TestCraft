import corsMiddleware from "cors";

import { config } from "@/infrastructure/config";

export const cors = corsMiddleware({
  origin: config.cors.allowedOrigins,
  credentials: true,
});
