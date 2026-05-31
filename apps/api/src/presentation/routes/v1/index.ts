import { Router } from "express";

import { projectService } from "@/container";
import { authenticate } from "@/presentation/middleware/auth.middleware";
import { requireProjectOwner } from "@/presentation/middleware/require-project-owner.middleware";
import projectRoutes from "@/presentation/routes/project.routes";
import testCaseRouter, {
  projectCasesRouter,
} from "@/presentation/routes/test-case.routes";
import testCaseStepRouter from "@/presentation/routes/test-case-step.routes";
import testResultRouter from "@/presentation/routes/test-result.routes";
import testRunRouter from "@/presentation/routes/test-run.routes";
import testSuiteRouter from "@/presentation/routes/test-suite.routes";

const router: Router = Router();

const projectRouter: Router = Router({ mergeParams: true });

projectRouter.use(authenticate, requireProjectOwner(projectService));

projectRouter.use("/cases", projectCasesRouter);

projectRouter.use("/suites", testSuiteRouter);

projectRouter.use("/suites/:suiteId/cases", testCaseRouter);

projectRouter.use("/suites/:suiteId/cases/:caseId/steps", testCaseStepRouter);

projectRouter.use("/runs", testRunRouter);

projectRouter.use("/runs/:runId/results", testResultRouter);

router.use("/projects", projectRoutes);

router.use("/projects/:projectId", projectRouter);

export default router;
