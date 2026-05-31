import { Request, Response } from "express";

import { ITestCaseStepService } from "@/application/test-case-steps/test-case-step.service";
import { problem, problems } from "@/presentation/errors/problem";
import { extractPagination } from "@/presentation/middleware/validate-request.middleware";

export class TestCaseStepController {
  constructor(private readonly testCaseStepService: ITestCaseStepService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const result = await this.testCaseStepService.getAll(
      req.params.caseId as string,
      extractPagination(req.query),
    );
    res.json(result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const step = await this.testCaseStepService.getById(
      req.params.caseId as string,
      req.params.id as string,
    );
    if (!step) {
      problem(res, problems.notFound());
      return;
    }
    res.json(step);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const step = await this.testCaseStepService.create(
      req.params.caseId as string,
      req.body,
    );
    res.status(201).json(step);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const step = await this.testCaseStepService.update(
      req.params.caseId as string,
      req.params.id as string,
      req.body,
    );
    if (!step) {
      problem(res, problems.notFound());
      return;
    }
    res.json(step);
  };

  bulkReorder = async (req: Request, res: Response): Promise<void> => {
    await this.testCaseStepService.bulkReorder(
      req.params.caseId as string,
      req.body.steps,
    );
    res.status(204).send();
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const deleted = await this.testCaseStepService.delete(
      req.params.caseId as string,
      req.params.id as string,
    );
    if (!deleted) {
      problem(res, problems.notFound());
      return;
    }
    res.status(204).send();
  };
}
