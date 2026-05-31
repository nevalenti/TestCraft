import { Router } from "express";

import { projectController } from "@/container";
import { authenticate } from "@/presentation/middleware/auth.middleware";
import {
  validateBody,
  validateQuery,
} from "@/presentation/middleware/validate-request.middleware";
import {
  createProjectSchema,
  projectQuerySchema,
  updateProjectSchema,
} from "@/presentation/schemas/project.schemas";

const router: Router = Router();

router.use(authenticate);

router.get("/", validateQuery(projectQuerySchema), projectController.getAll);

router.get("/:id", projectController.getById);

router.post("/", validateBody(createProjectSchema), projectController.create);

router.put("/:id", validateBody(updateProjectSchema), projectController.update);

router.delete("/:id", projectController.remove);

export default router;
