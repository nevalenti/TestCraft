export interface Label {
  id: string;
  name: string;
  color: string;
  projectId: string;
  createdAt: string;
}

export interface CreateLabel {
  name: string;
  color: string;
}

export interface UpdateLabel {
  name: string;
  color: string;
}
