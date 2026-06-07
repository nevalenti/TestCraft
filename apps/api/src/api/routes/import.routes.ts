import { Router } from "express";

import { validateBody } from "@/api/middleware/validate-request.middleware";
import {
  importAllureSchema,
  importJunitSchema,
} from "@/api/schemas/import.schemas";
import { importController } from "@/container";

const router: Router = Router({ mergeParams: true });

router.post(
  "/junit",
  validateBody(importJunitSchema),
  importController.importJUnit,
);

router.post(
  "/allure",
  validateBody(importAllureSchema),
  importController.importAllure,
);

export default router;
