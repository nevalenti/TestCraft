import { RequestHandler } from "express";

import { IProjectService } from "@/application/projects/project.service";
import { problem, problems } from "@/presentation/errors/problem";

export const requireProjectOwner =
  (service: IProjectService): RequestHandler =>
  async (req, res, next) => {
    const project = await service.getById(
      req.user!.id,
      req.params.projectId as string,
    );
    if (!project) {
      problem(res, problems.notFound());
      return;
    }
    next();
  };
