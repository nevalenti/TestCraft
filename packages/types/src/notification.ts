export interface WebhookSubscription {
  id: string;
  projectId: string;
  url: string;
  isActive: boolean;
  events: string[];
  createdAt: string;
}

export interface EmailSubscription {
  id: string;
  projectId: string;
  email: string;
  isActive: boolean;
  events: string[];
  createdAt: string;
}

export interface CreateWebhookSubscription {
  url: string;
  secret?: string;
  events: string[];
}

export interface UpdateWebhookSubscription {
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
}

export interface CreateEmailSubscription {
  email: string;
  events: string[];
}

export interface UpdateEmailSubscription {
  email: string;
  events: string[];
  isActive: boolean;
}
