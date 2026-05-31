import { Request, Response } from "express";

import { IProjectService } from "@/application/projects/project.service";
import { problem, problems } from "@/presentation/errors/problem";
import { extractPagination } from "@/presentation/middleware/validate-request.middleware";

export class ProjectController {
  constructor(private readonly projectService: IProjectService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const result = await this.projectService.getAll(
      req.user!.id,
      req.query.search as string | undefined,
      extractPagination(req.query),
    );
    res.json(result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const project = await this.projectService.getById(
      req.user!.id,
      req.params.id as string,
    );
    if (!project) {
      problem(res, problems.notFound());
      return;
    }
    res.json(project);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const project = await this.projectService.create(req.user!.id, req.body);
    res.status(201).json(project);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const project = await this.projectService.update(
      req.user!.id,
      req.params.id as string,
      req.body,
    );
    if (!project) {
      problem(res, problems.notFound());
      return;
    }
    res.json(project);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const deleted = await this.projectService.delete(
      req.user!.id,
      req.params.id as string,
    );
    if (!deleted) {
      problem(res, problems.notFound());
      return;
    }
    res.status(204).send();
  };
}
