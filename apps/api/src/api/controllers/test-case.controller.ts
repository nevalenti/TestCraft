import { Request, Response } from "express";

import { ITestCaseService } from "@/application/test-cases/test-case.service";
import { extractPagination } from "@/domain/pagination";

export class TestCaseController {
  constructor(private readonly testCaseService: ITestCaseService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const result = await this.testCaseService.getAll(
      req.params.suiteId as string,
      req.query.search as string | undefined,
      extractPagination(req.query),
    );

    res.json(result);
  };

  getAllByProject = async (req: Request, res: Response): Promise<void> => {
    const result = await this.testCaseService.getAllByProject(
      req.params.projectId as string,
      req.query.search as string | undefined,
      extractPagination(req.query),
    );

    res.json(result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const testCase = await this.testCaseService.getById(
      req.params.suiteId as string,
      req.params.id as string,
    );

    res.json(testCase);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const testCase = await this.testCaseService.create(
      req.params.suiteId as string,
      req.body,
    );

    res.status(201).json(testCase);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const testCase = await this.testCaseService.update(
      req.params.suiteId as string,
      req.params.id as string,
      req.body,
    );

    res.json(testCase);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.testCaseService.delete(
      req.params.suiteId as string,
      req.params.id as string,
    );
    res.status(204).send();
  };
}
