import { asClass, asValue, createContainer, InjectionMode } from "awilix";

import { ImportController } from "@/api/controllers/import.controller";
import { ProjectController } from "@/api/controllers/project.controller";
import { TestCaseController } from "@/api/controllers/test-case.controller";
import { TestCaseStepController } from "@/api/controllers/test-case-step.controller";
import { TestResultController } from "@/api/controllers/test-result.controller";
import { TestRunController } from "@/api/controllers/test-run.controller";
import { TestSuiteController } from "@/api/controllers/test-suite.controller";
import { ImportService } from "@/application/import/import.service";
import { ProjectService } from "@/application/projects/project.service";
import { TestCaseStepService } from "@/application/test-case-steps/test-case-step.service";
import { TestCaseService } from "@/application/test-cases/test-case.service";
import { TestResultService } from "@/application/test-results/test-result.service";
import { TestRunService } from "@/application/test-runs/test-run.service";
import { TestSuiteService } from "@/application/test-suites/test-suite.service";
import { CacheService } from "@/infrastructure/cache/cache.service";
import redisClient from "@/infrastructure/cache/redis.client";
import prismaClient from "@/infrastructure/database/prisma.client";
import { ImportRepository } from "@/infrastructure/repositories/import.repository";
import { ProjectRepository } from "@/infrastructure/repositories/project.repository";
import { TestCaseRepository } from "@/infrastructure/repositories/test-case.repository";
import { TestCaseStepRepository } from "@/infrastructure/repositories/test-case-step.repository";
import { TestResultRepository } from "@/infrastructure/repositories/test-result.repository";
import { TestRunRepository } from "@/infrastructure/repositories/test-run.repository";
import { TestSuiteRepository } from "@/infrastructure/repositories/test-suite.repository";

interface Cradle {
  prisma: typeof prismaClient;
  cache: CacheService;

  projectRepository: ProjectRepository;
  testSuiteRepository: TestSuiteRepository;
  testCaseRepository: TestCaseRepository;
  testCaseStepRepository: TestCaseStepRepository;
  testRunRepository: TestRunRepository;
  testResultRepository: TestResultRepository;
  importRepository: ImportRepository;

  projectService: ProjectService;
  testSuiteService: TestSuiteService;
  testCaseService: TestCaseService;
  testCaseStepService: TestCaseStepService;
  testRunService: TestRunService;
  testResultService: TestResultService;
  importService: ImportService;

  projectController: ProjectController;
  testSuiteController: TestSuiteController;
  testCaseController: TestCaseController;
  testCaseStepController: TestCaseStepController;
  testRunController: TestRunController;
  testResultController: TestResultController;
  importController: ImportController;
}

const container = createContainer<Cradle>({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  prisma: asValue(prismaClient),
  cache: asValue(new CacheService(redisClient)),

  projectRepository: asClass(ProjectRepository).singleton(),
  testSuiteRepository: asClass(TestSuiteRepository).singleton(),
  testCaseRepository: asClass(TestCaseRepository).singleton(),
  testCaseStepRepository: asClass(TestCaseStepRepository).singleton(),
  testRunRepository: asClass(TestRunRepository).singleton(),
  testResultRepository: asClass(TestResultRepository).singleton(),
  importRepository: asClass(ImportRepository).singleton(),

  projectService: asClass(ProjectService).singleton(),
  testSuiteService: asClass(TestSuiteService).singleton(),
  testCaseService: asClass(TestCaseService).singleton(),
  testCaseStepService: asClass(TestCaseStepService).singleton(),
  testRunService: asClass(TestRunService).singleton(),
  testResultService: asClass(TestResultService).singleton(),
  importService: asClass(ImportService).singleton(),

  projectController: asClass(ProjectController).singleton(),
  testSuiteController: asClass(TestSuiteController).singleton(),
  testCaseController: asClass(TestCaseController).singleton(),
  testCaseStepController: asClass(TestCaseStepController).singleton(),
  testRunController: asClass(TestRunController).singleton(),
  testResultController: asClass(TestResultController).singleton(),
  importController: asClass(ImportController).singleton(),
});

export const {
  projectService,
  projectController,
  testSuiteController,
  testCaseController,
  testCaseStepController,
  testRunController,
  testResultController,
  importController,
} = container.cradle;
