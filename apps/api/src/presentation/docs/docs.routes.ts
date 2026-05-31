import { Router } from "express";
import swaggerUi from "swagger-ui-express";

import { openApiDocument } from "@/presentation/docs/openapi";

const router: Router = Router();

router.use("/", swaggerUi.serve);
router.get(
  "/",
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: "TestCraft API",
    swaggerOptions: { persistAuthorization: true },
  }),
);

export default router;
