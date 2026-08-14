export type DetectedFormat = 'junit' | 'allure' | 'mixed' | null;

export const detectFormat = (files: File[]): DetectedFormat => {
  if (files.length === 0) return null;

  if (files.every((file) => file.name.toLowerCase().endsWith('.xml')))
    return 'junit';

  if (files.every((file) => file.name.toLowerCase().endsWith('.json')))
    return 'allure';

  return 'mixed';
};
