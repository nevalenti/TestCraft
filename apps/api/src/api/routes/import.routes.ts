import { json, Router } from "express";

import { validateBody } from "@/api/middleware/validate-request.middleware";
import {
  importAllureSchema,
  importJUnitSchema,
} from "@/api/schemas/import.schemas";
import { importController } from "@/container";

const router: Router = Router({ mergeParams: true });

router.use(json({ limit: "5mb" }));

router.post(
  "/junit",
  validateBody(importJUnitSchema),
  importController.importJUnit,
);

router.post(
  "/allure",
  validateBody(importAllureSchema),
  importController.importAllure,
);

export default router;
