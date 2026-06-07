import { Router } from "express";

import {
  validateBody,
  validateQuery,
} from "@/api/middleware/validate-request.middleware";
import {
  createTestRunSchema,
  testRunQuerySchema,
  updateTestRunSchema,
} from "@/api/schemas/test-run.schemas";
import { testRunController } from "@/container";

const router: Router = Router({ mergeParams: true });

router.get("/", validateQuery(testRunQuerySchema), testRunController.getAll);

router.get("/:id", testRunController.getById);

router.get("/:id/summary", testRunController.getSummary);

router.post("/", validateBody(createTestRunSchema), testRunController.create);

router.put("/:id", validateBody(updateTestRunSchema), testRunController.update);

router.delete("/:id", testRunController.remove);

export default router;
