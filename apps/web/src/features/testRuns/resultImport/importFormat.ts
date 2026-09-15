import type { AllureResultItem } from '@testcraft/types';

export type DetectedFormat = 'junit' | 'allure' | 'mixed' | null;

export const detectFormat = (files: File[]): DetectedFormat => {
  if (files.length === 0) return null;

  if (files.every((file) => file.name.toLowerCase().endsWith('.xml')))
    return 'junit';

  if (files.every((file) => file.name.toLowerCase().endsWith('.json')))
    return 'allure';

  return 'mixed';
};

export const parseAllureFiles = async (
  files: File[],
): Promise<{ results: AllureResultItem[] } | { fileError: string }> => {
  const texts = await Promise.all(files.map((file) => file.text()));
  const results: AllureResultItem[] = [];

  for (const [i, text] of texts.entries()) {
    try {
      const parsed = JSON.parse(text) as AllureResultItem | AllureResultItem[];
      if (Array.isArray(parsed)) results.push(...parsed);
      else results.push(parsed);
    } catch {
      return { fileError: `"${files[i].name}" is not valid JSON` };
    }
  }

  return { results };
};
