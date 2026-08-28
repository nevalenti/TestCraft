import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ImportForm } from '@/features/testRuns/resultImport/ImportForm';

const xmlFile = (name = 'report.xml', content = '<xml/>') =>
  new File([content], name, { type: 'text/xml' });

const jsonFile = (name = 'result.json', content = '{}') =>
  new File([content], name, { type: 'application/json' });

const oversizedFile = () => {
  const file = new File(['x'], 'huge.xml', { type: 'text/xml' });
  Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
  return file;
};

const uploadFiles = async (files: File[]) => {
  const input = document.querySelector(
    'input#import-files',
  ) as HTMLInputElement;
  await userEvent.upload(input, files);
};

const fillEnvironment = async (value: string) => {
  await userEvent.type(screen.getByLabelText('Environment'), value);
};

describe('ImportForm', () => {
  describe('given an empty form — submitting shows validation errors', () => {
    it('requires a file and an environment', async () => {
      render(
        <ImportForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      );

      await userEvent.click(screen.getByRole('button', { name: /import/i }));

      expect(
        await screen.findByText('Please drop a file to import'),
      ).toBeInTheDocument();
      expect(screen.getByText('Environment is required')).toBeInTheDocument();
    });
  });

  describe('given a single .xml file — detects JUnit format', () => {
    it('shows the JUnit detected badge', async () => {
      render(
        <ImportForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      );
      await uploadFiles([xmlFile()]);

      expect(await screen.findByText('JUnit XML detected')).toBeInTheDocument();
    });
  });

  describe('given .json files — detects Allure format', () => {
    it('shows the Allure detected badge', async () => {
      render(
        <ImportForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      );
      await uploadFiles([jsonFile()]);

      expect(
        await screen.findByText('Allure JSON detected'),
      ).toBeInTheDocument();
    });
  });

  describe('given mixed file types — submitting shows a validation error', () => {
    it('rejects the mixed selection', async () => {
      render(
        <ImportForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      );
      await uploadFiles([xmlFile(), jsonFile()]);
      await fillEnvironment('staging');

      await userEvent.click(screen.getByRole('button', { name: /import/i }));

      expect(
        await screen.findByText(
          'All files must be the same type (.xml or .json)',
        ),
      ).toBeInTheDocument();
    });
  });

  describe('given more than one JUnit file — submitting shows a validation error', () => {
    it('rejects multiple XML files', async () => {
      render(
        <ImportForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      );
      await uploadFiles([xmlFile('a.xml'), xmlFile('b.xml')]);
      await fillEnvironment('staging');

      await userEvent.click(screen.getByRole('button', { name: /import/i }));

      expect(
        await screen.findByText('JUnit import supports a single XML file'),
      ).toBeInTheDocument();
    });
  });

  describe('given a file over the 5 MB limit — submitting shows a validation error', () => {
    it('rejects the oversized file', async () => {
      render(
        <ImportForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      );
      await uploadFiles([oversizedFile()]);
      await fillEnvironment('staging');

      await userEvent.click(screen.getByRole('button', { name: /import/i }));

      expect(
        await screen.findByText('"huge.xml" exceeds the 5 MB size limit'),
      ).toBeInTheDocument();
    });
  });

  describe('given invalid Allure JSON — submitting surfaces a file error', () => {
    it('reports the file that failed to parse', async () => {
      render(
        <ImportForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      );
      await uploadFiles([jsonFile('bad.json', 'not json')]);
      await fillEnvironment('staging');

      await userEvent.click(screen.getByRole('button', { name: /import/i }));

      expect(
        await screen.findByText('"bad.json" is not valid JSON'),
      ).toBeInTheDocument();
    });
  });

  describe('given a valid JUnit import — submits the parsed xml', () => {
    it('calls onSubmit with a junit payload', async () => {
      const onSubmit = vi.fn();
      render(
        <ImportForm onSubmit={onSubmit} onCancel={vi.fn()} isLoading={false} />,
      );
      await uploadFiles([xmlFile('report.xml', '<testsuite/>')]);
      await fillEnvironment('staging');

      await userEvent.click(screen.getByRole('button', { name: /import/i }));

      await vi.waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          type: 'junit',
          xml: '<testsuite/>',
          environment: 'staging',
          name: undefined,
        });
      });
    });
  });

  describe('given a valid Allure import — submits the parsed results', () => {
    it('calls onSubmit with an allure payload, flattening array results', async () => {
      const onSubmit = vi.fn();
      render(
        <ImportForm onSubmit={onSubmit} onCancel={vi.fn()} isLoading={false} />,
      );
      await uploadFiles([
        jsonFile('a.json', JSON.stringify({ uuid: '1' })),
        jsonFile('b.json', JSON.stringify([{ uuid: '2' }, { uuid: '3' }])),
      ]);
      await fillEnvironment('staging');

      await userEvent.click(screen.getByRole('button', { name: /import/i }));

      await vi.waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          type: 'allure',
          results: [{ uuid: '1' }, { uuid: '2' }, { uuid: '3' }],
          environment: 'staging',
          name: undefined,
        });
      });
    });
  });

  describe('given Cancel is clicked', () => {
    it('calls onCancel', async () => {
      const onCancel = vi.fn();
      render(
        <ImportForm onSubmit={vi.fn()} onCancel={onCancel} isLoading={false} />,
      );

      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
