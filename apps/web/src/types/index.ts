export type ModalState<T> =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'import' }
  | { type: 'edit'; item: T }
  | { type: 'delete'; item: T };

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
