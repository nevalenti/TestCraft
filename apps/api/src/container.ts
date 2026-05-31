import { ProjectService } from "@/application/projects/project.service";
import { TestCaseStepService } from "@/application/test-case-steps/test-case-step.service";
import { TestCaseService } from "@/application/test-cases/test-case.service";
import { TestResultService } from "@/application/test-results/test-result.service";
import { TestRunService } from "@/application/test-runs/test-run.service";
import { TestSuiteService } from "@/application/test-suites/test-suite.service";
import prismaClient from "@/infrastructure/database/prisma.client";
import { ProjectRepository } from "@/infrastructure/repositories/project.repository";
import { TestCaseRepository } from "@/infrastructure/repositories/test-case.repository";
import { TestCaseStepRepository } from "@/infrastructure/repositories/test-case-step.repository";
import { TestResultRepository } from "@/infrastructure/repositories/test-result.repository";
import { TestRunRepository } from "@/infrastructure/repositories/test-run.repository";
import { TestSuiteRepository } from "@/infrastructure/repositories/test-suite.repository";
import { ProjectController } from "@/presentation/controllers/project.controller";
import { TestCaseController } from "@/presentation/controllers/test-case.controller";
import { TestCaseStepController } from "@/presentation/controllers/test-case-step.controller";
import { TestResultController } from "@/presentation/controllers/test-result.controller";
import { TestRunController } from "@/presentation/controllers/test-run.controller";
import { TestSuiteController } from "@/presentation/controllers/test-suite.controller";

const projectRepository = new ProjectRepository(prismaClient);
const testSuiteRepository = new TestSuiteRepository(prismaClient);
const testCaseRepository = new TestCaseRepository(prismaClient);
const testCaseStepRepository = new TestCaseStepRepository(prismaClient);
const testRunRepository = new TestRunRepository(prismaClient);
const testResultRepository = new TestResultRepository(prismaClient);

export const projectService = new ProjectService(projectRepository);
const testSuiteService = new TestSuiteService(testSuiteRepository);
const testCaseService = new TestCaseService(testCaseRepository);
const testCaseStepService = new TestCaseStepService(testCaseStepRepository);
const testRunService = new TestRunService(testRunRepository);
const testResultService = new TestResultService(
  testResultRepository,
  testRunRepository,
);

export const projectController = new ProjectController(projectService);
export const testSuiteController = new TestSuiteController(testSuiteService);
export const testCaseController = new TestCaseController(testCaseService);
export const testCaseStepController = new TestCaseStepController(
  testCaseStepService,
);
export const testRunController = new TestRunController(testRunService);
export const testResultController = new TestResultController(testResultService);
