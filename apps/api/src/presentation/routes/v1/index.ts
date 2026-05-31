import { Router } from "express";

import { projectService } from "@/container";
import { authenticate } from "@/presentation/middleware/auth.middleware";
import { requireProjectOwner } from "@/presentation/middleware/require-project-owner.middleware";
import projectRouter from "@/presentation/routes/project.routes";
import testCaseRouter, {
  projectCasesRouter,
} from "@/presentation/routes/test-case.routes";
import testCaseStepRouter from "@/presentation/routes/test-case-step.routes";
import testResultRouter from "@/presentation/routes/test-result.routes";
import testRunRouter from "@/presentation/routes/test-run.routes";
import testSuiteRouter from "@/presentation/routes/test-suite.routes";

const router: Router = Router();

const ownedProjectRouter: Router = Router({ mergeParams: true });
ownedProjectRouter.use(authenticate, requireProjectOwner(projectService));
ownedProjectRouter.use("/cases", projectCasesRouter);
ownedProjectRouter.use("/suites", testSuiteRouter);
ownedProjectRouter.use("/suites/:suiteId/cases", testCaseRouter);
ownedProjectRouter.use(
  "/suites/:suiteId/cases/:caseId/steps",
  testCaseStepRouter,
);
ownedProjectRouter.use("/runs", testRunRouter);
ownedProjectRouter.use("/runs/:runId/results", testResultRouter);

router.use("/projects", projectRouter);
router.use("/projects/:projectId", ownedProjectRouter);

export default router;
