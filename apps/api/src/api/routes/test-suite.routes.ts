import { Router } from "express";

import {
  validateBody,
  validateQuery,
} from "@/api/middleware/validate-request.middleware";
import {
  createTestSuiteSchema,
  testSuiteQuerySchema,
  updateTestSuiteSchema,
} from "@/api/schemas/test-suite.schemas";
import { testSuiteController } from "@/container";

const router: Router = Router({ mergeParams: true });

router.get(
  "/",
  validateQuery(testSuiteQuerySchema),
  testSuiteController.getAll,
);

router.get("/:id", testSuiteController.getById);

router.post(
  "/",
  validateBody(createTestSuiteSchema),
  testSuiteController.create,
);

router.put(
  "/:id",
  validateBody(updateTestSuiteSchema),
  testSuiteController.update,
);

router.delete("/:id", testSuiteController.remove);

export default router;
