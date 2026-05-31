import { TestResultStatus } from "@testcraft/types";
import { Request, Response } from "express";

import { ITestResultService } from "@/application/test-results/test-result.service";
import { problem, problems } from "@/presentation/errors/problem";
import { extractPagination } from "@/presentation/middleware/validate-request.middleware";

export class TestResultController {
  constructor(private readonly testResultService: ITestResultService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const result = await this.testResultService.getAll(
      req.params.runId as string,
      req.query.status as TestResultStatus | undefined,
      extractPagination(req.query),
    );
    res.json(result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const result = await this.testResultService.getById(
      req.params.runId as string,
      req.params.id as string,
    );
    if (!result) {
      problem(res, problems.notFound());
      return;
    }
    res.json(result);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const result = await this.testResultService.create(
      req.params.runId as string,
      req.body,
      req.user?.id,
    );
    res.status(201).json(result);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const result = await this.testResultService.update(
      req.params.runId as string,
      req.params.id as string,
      req.body,
    );
    if (!result) {
      problem(res, problems.notFound());
      return;
    }
    res.json(result);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const deleted = await this.testResultService.delete(
      req.params.runId as string,
      req.params.id as string,
    );
    if (!deleted) {
      problem(res, problems.notFound());
      return;
    }
    res.status(204).send();
  };
}
