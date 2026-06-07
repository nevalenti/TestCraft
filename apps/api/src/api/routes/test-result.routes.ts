import { Router } from "express";

import {
  validateBody,
  validateQuery,
} from "@/api/middleware/validate-request.middleware";
import {
  createTestResultSchema,
  testResultQuerySchema,
  updateTestResultSchema,
} from "@/api/schemas/test-result.schemas";
import { testResultController } from "@/container";

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
