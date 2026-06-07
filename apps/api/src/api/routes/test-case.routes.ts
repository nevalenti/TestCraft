import { Router } from "express";

import {
  validateBody,
  validateQuery,
} from "@/api/middleware/validate-request.middleware";
import {
  createTestCaseSchema,
  testCaseQuerySchema,
  updateTestCaseSchema,
} from "@/api/schemas/test-case.schemas";
import { testCaseController } from "@/container";

const router: Router = Router({ mergeParams: true });

router.get("/", validateQuery(testCaseQuerySchema), testCaseController.getAll);

router.get("/:id", testCaseController.getById);

router.post("/", validateBody(createTestCaseSchema), testCaseController.create);

router.put(
  "/:id",
  validateBody(updateTestCaseSchema),
  testCaseController.update,
);

router.delete("/:id", testCaseController.remove);

export default router;

export const projectCasesRouter: Router = Router({ mergeParams: true });

projectCasesRouter.get(
  "/",
  validateQuery(testCaseQuerySchema),
  testCaseController.getAllByProject,
);
