import { Router } from "express";

import { testCaseStepController } from "@/container";
import {
  validateBody,
  validateQuery,
} from "@/presentation/middleware/validate-request.middleware";
import { paginationSchema } from "@/presentation/schemas/pagination.schemas";
import {
  bulkReorderStepsSchema,
  createTestCaseStepSchema,
  updateTestCaseStepSchema,
} from "@/presentation/schemas/test-case-step.schemas";

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
