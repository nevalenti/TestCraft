import { Router } from "express";

import {
  validateBody,
  validateQuery,
} from "@/api/middleware/validate-request.middleware";
import { paginationSchema } from "@/api/schemas/pagination.schemas";
import {
  bulkReorderStepsSchema,
  createTestCaseStepSchema,
  updateTestCaseStepSchema,
} from "@/api/schemas/test-case-step.schemas";
import { testCaseStepController } from "@/container";

const router: Router = Router({ mergeParams: true });

router.get("/", validateQuery(paginationSchema), testCaseStepController.getAll);

router.get("/:id", testCaseStepController.getById);

router.post(
  "/",
  validateBody(createTestCaseStepSchema),
  testCaseStepController.create,
);

router.put(
  "/reorder",
  validateBody(bulkReorderStepsSchema),
  testCaseStepController.bulkReorder,
);

router.put(
  "/:id",
  validateBody(updateTestCaseStepSchema),
  testCaseStepController.update,
);

router.delete("/:id", testCaseStepController.remove);

export default router;
