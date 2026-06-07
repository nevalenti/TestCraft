import { Request, Response } from "express";

import { IImportService } from "@/application/import/import.service";

export class ImportController {
  constructor(private readonly importService: IImportService) {}

  importJUnit = async (req: Request, res: Response): Promise<void> => {
    const run = await this.importService.importJUnit(
      req.params.projectId as string,
      req.body,
      req.user?.id,
    );
    res.status(201).json(run);
  };

  importAllure = async (req: Request, res: Response): Promise<void> => {
    const run = await this.importService.importAllure(
      req.params.projectId as string,
      req.body,
      req.user?.id,
    );
    res.status(201).json(run);
  };
}
