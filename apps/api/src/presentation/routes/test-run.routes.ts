import { Router } from "express";

import { testRunController } from "@/container";
import {
  validateBody,
  validateQuery,
} from "@/presentation/middleware/validate-request.middleware";
import { paginationSchema } from "@/presentation/schemas/pagination.schemas";
import {
  createTestRunSchema,
  updateTestRunSchema,
} from "@/presentation/schemas/test-run.schemas";

const router: Router = Router({ mergeParams: true });

router.get("/", validateQuery(paginationSchema), testRunController.getAll);
router.get("/:id", testRunController.getById);
router.get("/:id/summary", testRunController.getSummary);
router.post("/", validateBody(createTestRunSchema), testRunController.create);
router.put("/:id", validateBody(updateTestRunSchema), testRunController.update);
router.delete("/:id", testRunController.remove);

export default router;
