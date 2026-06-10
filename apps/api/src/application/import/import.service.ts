import type { AllureResultItem } from "@testcraft/types";
import { TestRunStatus } from "@testcraft/types";

import type { TestRun } from "@/domain/test-run";

import { parseAllure } from "./allure.parser";
import type { IImportRepository } from "./import.repository";
import { parseJUnit } from "./junit.parser";

export interface ImportJUnit {
  xml: string;
  environment: string;
  name?: string;
  source?: string;
}

export interface ImportAllure {
  results: AllureResultItem[];
  environment: string;
  name?: string;
  source?: string;
}

export interface IImportService {
  importJUnit(
    projectId: string,
    input: ImportJUnit,
    userId?: string,
  ): Promise<TestRun>;
  importAllure(
    projectId: string,
    input: ImportAllure,
    userId?: string,
  ): Promise<TestRun>;
}

export class ImportService implements IImportService {
  constructor(private readonly importRepository: IImportRepository) {}

  async importJUnit(
    projectId: string,
    input: ImportJUnit,
    userId?: string,
  ): Promise<TestRun> {
    const { runName, cases } = parseJUnit(input.xml);

    return this.importRepository.createRunWithResults(
      projectId,
      input.name ?? runName,
      input.environment,
      TestRunStatus.Completed,
      cases,
      userId,
      input.source,
    );
  }

  async importAllure(
    projectId: string,
    input: ImportAllure,
    userId?: string,
  ): Promise<TestRun> {
    const cases = parseAllure(input.results);

    return this.importRepository.createRunWithResults(
      projectId,
      input.name ?? "Allure Import",
      input.environment,
      TestRunStatus.Completed,
      cases,
      userId,
      input.source,
    );
  }
}
