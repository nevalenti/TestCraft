import { Router } from "express";

import { projectController } from "@/container";
import { authenticate } from "@/presentation/middleware/auth.middleware";
import {
  validateBody,
  validateQuery,
} from "@/presentation/middleware/validate-request.middleware";
import { paginationSchema } from "@/presentation/schemas/pagination.schemas";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/presentation/schemas/project.schemas";

const router: Router = Router();

router.get(
  "/",
  authenticate,
  validateQuery(paginationSchema),
  projectController.getAll,
);
router.get("/:id", authenticate, projectController.getById);
router.post(
  "/",
  authenticate,
  validateBody(createProjectSchema),
  projectController.create,
);
router.put(
  "/:id",
  authenticate,
  validateBody(updateProjectSchema),
  projectController.update,
);
router.delete("/:id", authenticate, projectController.remove);

export default router;
