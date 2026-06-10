import { TestResultStatus } from "@testcraft/types";
import { Request, Response } from "express";

import { ITestResultService } from "@/application/test-results/test-result.service";
import { extractPagination } from "@/domain/pagination";

export class TestResultController {
  constructor(private readonly testResultService: ITestResultService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const result = await this.testResultService.getAll(
      req.params.runId as string,
      req.query.status as TestResultStatus | undefined,
      extractPagination(req.query),
      req.query.search as string | undefined,
    );

    res.json(result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const result = await this.testResultService.getById(
      req.params.runId as string,
      req.params.id as string,
    );

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

    res.json(result);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.testResultService.delete(
      req.params.runId as string,
      req.params.id as string,
    );
    res.status(204).send();
  };
}
