import { Request, Response } from "express";

import { ITestRunService } from "@/application/test-runs/test-run.service";
import { extractPagination } from "@/presentation/middleware/validate-request.middleware";

export class TestRunController {
  constructor(private readonly testRunService: ITestRunService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const result = await this.testRunService.getAll(
      req.params.projectId as string,
      extractPagination(req.query),
      req.query.search as string | undefined,
    );
    res.json(result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const run = await this.testRunService.getById(
      req.params.projectId as string,
      req.params.id as string,
    );
    res.json(run);
  };

  getSummary = async (req: Request, res: Response): Promise<void> => {
    const summary = await this.testRunService.getSummary(
      req.params.projectId as string,
      req.params.id as string,
    );
    res.json(summary);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const run = await this.testRunService.create(
      req.params.projectId as string,
      req.body,
    );
    res.status(201).json(run);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const run = await this.testRunService.update(
      req.params.projectId as string,
      req.params.id as string,
      req.body,
    );
    res.json(run);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.testRunService.delete(
      req.params.projectId as string,
      req.params.id as string,
    );
    res.status(204).send();
  };
}
