import { Request, Response } from "express";

import { ITestSuiteService } from "@/application/test-suites/test-suite.service";
import { extractPagination } from "@/domain/pagination";

export class TestSuiteController {
  constructor(private readonly testSuiteService: ITestSuiteService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const result = await this.testSuiteService.getAll(
      req.params.projectId as string,
      extractPagination(req.query),
      req.query.search as string | undefined,
    );

    res.json(result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const suite = await this.testSuiteService.getById(
      req.params.projectId as string,
      req.params.id as string,
    );

    res.json(suite);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const suite = await this.testSuiteService.create(
      req.params.projectId as string,
      req.body,
    );

    res.status(201).json(suite);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const suite = await this.testSuiteService.update(
      req.params.projectId as string,
      req.params.id as string,
      req.body,
    );

    res.json(suite);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.testSuiteService.delete(
      req.params.projectId as string,
      req.params.id as string,
    );
    res.status(204).send();
  };
}
