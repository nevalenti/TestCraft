import { Router } from "express";

import { authenticate } from "@/api/middleware/auth.middleware";
import {
  validateBody,
  validateQuery,
} from "@/api/middleware/validate-request.middleware";
import {
  createProjectSchema,
  projectQuerySchema,
  updateProjectSchema,
} from "@/api/schemas/project.schemas";
import { projectController } from "@/container";

const router: Router = Router();

router.use(authenticate);

router.get("/", validateQuery(projectQuerySchema), projectController.getAll);

router.get("/:id", projectController.getById);

router.post("/", validateBody(createProjectSchema), projectController.create);

router.put("/:id", validateBody(updateProjectSchema), projectController.update);

router.delete("/:id", projectController.remove);

export default router;
