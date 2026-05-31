import { Request, Response } from "express";

import { ITestCaseService } from "@/application/test-cases/test-case.service";
import { problem, problems } from "@/presentation/errors/problem";
import { extractPagination } from "@/presentation/middleware/validate-request.middleware";

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
    const tc = await this.testCaseService.getById(
      req.params.suiteId as string,
      req.params.id as string,
    );
    if (!tc) {
      problem(res, problems.notFound());
      return;
    }
    res.json(tc);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const tc = await this.testCaseService.create(
      req.params.suiteId as string,
      req.body,
    );
    res.status(201).json(tc);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const tc = await this.testCaseService.update(
      req.params.suiteId as string,
      req.params.id as string,
      req.body,
    );
    if (!tc) {
      problem(res, problems.notFound());
      return;
    }
    res.json(tc);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const deleted = await this.testCaseService.delete(
      req.params.suiteId as string,
      req.params.id as string,
    );
    if (!deleted) {
      problem(res, problems.notFound());
      return;
    }
    res.status(204).send();
  };
}
