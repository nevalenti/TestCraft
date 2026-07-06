import type { components } from "./generated/schema.js";

export type Project =
  components["schemas"]["TestCraft.Application.Projects.ProjectResponse"];
export type CreateProject =
  components["schemas"]["TestCraft.Application.Projects.CreateProject.Command"];
export type UpdateProject =
  components["schemas"]["TestCraft.Application.Projects.UpdateProject.Command"];
