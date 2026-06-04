import { Router } from "express";

import { importController } from "@/container";
import { validateBody } from "@/presentation/middleware/validate-request.middleware";
import {
  importAllureSchema,
  importJunitSchema,
} from "@/presentation/schemas/import.schemas";

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
