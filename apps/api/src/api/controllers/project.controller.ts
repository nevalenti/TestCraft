import { Request, Response } from "express";

import { extractPagination } from "@/api/middleware/validate-request.middleware";
import { IProjectService } from "@/application/projects/project.service";

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
    res.json(project);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.projectService.delete(req.user!.id, req.params.id as string);
    res.status(204).send();
  };
}
