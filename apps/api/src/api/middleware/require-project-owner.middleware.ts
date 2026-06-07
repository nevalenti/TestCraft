import { RequestHandler } from "express";

import { IProjectService } from "@/application/projects/project.service";

export const requireProjectOwner =
  (service: IProjectService): RequestHandler =>
  async (req, _res, next) => {
    await service.getById(req.user!.id, req.params.projectId as string);
    next();
  };
