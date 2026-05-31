import { Router } from "express";

import { testSuiteController } from "@/container";
import {
  validateBody,
  validateQuery,
} from "@/presentation/middleware/validate-request.middleware";
import { paginationSchema } from "@/presentation/schemas/pagination.schemas";
import {
  createTestSuiteSchema,
  updateTestSuiteSchema,
} from "@/presentation/schemas/test-suite.schemas";

const router: Router = Router({ mergeParams: true });

router.get("/", validateQuery(paginationSchema), testSuiteController.getAll);

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
