import { Router } from "express";

import { testResultController } from "@/container";
import {
  validateBody,
  validateQuery,
} from "@/presentation/middleware/validate-request.middleware";
import {
  createTestResultSchema,
  testResultQuerySchema,
  updateTestResultSchema,
} from "@/presentation/schemas/test-result.schemas";

const router: Router = Router({ mergeParams: true });

router.get(
  "/",
  validateQuery(testResultQuerySchema),
  testResultController.getAll,
);

router.get("/:id", testResultController.getById);

router.post(
  "/",
  validateBody(createTestResultSchema),
  testResultController.create,
);

router.put(
  "/:id",
  validateBody(updateTestResultSchema),
  testResultController.update,
);

router.delete("/:id", testResultController.remove);

export default router;
