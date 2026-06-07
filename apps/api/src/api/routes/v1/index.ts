import { Router } from "express";

import { authenticate } from "@/api/middleware/auth.middleware";
import { requireProjectOwner } from "@/api/middleware/require-project-owner.middleware";
import importRouter from "@/api/routes/import.routes";
import projectRoutes from "@/api/routes/project.routes";
import testCaseRouter, {
  projectCasesRouter,
} from "@/api/routes/test-case.routes";
import testCaseStepRouter from "@/api/routes/test-case-step.routes";
import testResultRouter from "@/api/routes/test-result.routes";
import testRunRouter from "@/api/routes/test-run.routes";
import testSuiteRouter from "@/api/routes/test-suite.routes";
import { projectService } from "@/container";

const router: Router = Router();

const projectRouter: Router = Router({ mergeParams: true });

projectRouter.use(authenticate, requireProjectOwner(projectService));

projectRouter.use("/import", importRouter);

projectRouter.use("/cases", projectCasesRouter);

projectRouter.use("/suites", testSuiteRouter);

projectRouter.use("/suites/:suiteId/cases", testCaseRouter);

projectRouter.use("/suites/:suiteId/cases/:caseId/steps", testCaseStepRouter);

projectRouter.use("/runs", testRunRouter);

projectRouter.use("/runs/:runId/results", testResultRouter);

router.use("/projects", projectRoutes);

router.use("/projects/:projectId", projectRouter);

export default router;
