import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FileDropZone } from '@/features/testRuns/FileDropZone';

const xmlFile = new File(['<xml/>'], 'report.xml', { type: 'text/xml' });
const jsonFile = new File(['{}'], 'result.json', { type: 'application/json' });

describe('FileDropZone', () => {
  describe('given no files — shows the upload prompt', () => {
    it('renders the hint text', () => {
      render(
        <FileDropZone
          id="files"
          accept=".xml,.json"
          files={[]}
          onFilesChange={vi.fn()}
          hint="Drop a .xml or .json file"
        />,
      );
      expect(screen.getByText('Drop a .xml or .json file')).toBeInTheDocument();
      expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
    });
  });

  describe('given files are selected via the native picker', () => {
    it('reports the selected files through onFilesChange', async () => {
      const onFilesChange = vi.fn();
      const { container } = render(
        <FileDropZone
          id="files"
          accept=".xml,.json"
          files={[]}
          onFilesChange={onFilesChange}
        />,
      );

      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      await userEvent.upload(input, xmlFile);

      expect(onFilesChange).toHaveBeenCalledWith([xmlFile]);
    });
  });

  describe('given a click on the drop zone — opens the native file picker', () => {
    it('delegates to the hidden input', async () => {
      const { container } = render(
        <FileDropZone
          id="files"
          accept=".xml,.json"
          files={[]}
          onFilesChange={vi.fn()}
        />,
      );

      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');

      await userEvent.click(
        screen.getByRole('button', { name: /file upload area/i }),
      );

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('given files dropped that match the accept filter', () => {
    it('reports only the accepted files', () => {
      const onFilesChange = vi.fn();
      render(
        <FileDropZone
          id="files"
          accept=".xml"
          files={[]}
          onFilesChange={onFilesChange}
        />,
      );

      const zone = screen.getByRole('button', { name: /file upload area/i });
      fireEvent.drop(zone, { dataTransfer: { files: [xmlFile, jsonFile] } });

      expect(onFilesChange).toHaveBeenCalledWith([xmlFile]);
    });

    it('does not call onFilesChange when nothing dropped matches', () => {
      const onFilesChange = vi.fn();
      render(
        <FileDropZone
          id="files"
          accept=".xml"
          files={[]}
          onFilesChange={onFilesChange}
        />,
      );

      const zone = screen.getByRole('button', { name: /file upload area/i });
      fireEvent.drop(zone, { dataTransfer: { files: [jsonFile] } });

      expect(onFilesChange).not.toHaveBeenCalled();
    });
  });

  describe('given already-selected files — lists them', () => {
    it('shows each file name and formatted size', () => {
      render(
        <FileDropZone
          id="files"
          accept=".xml,.json"
          files={[xmlFile, jsonFile]}
          onFilesChange={vi.fn()}
        />,
      );

      expect(screen.getByText('report.xml')).toBeInTheDocument();
      expect(screen.getByText('result.json')).toBeInTheDocument();
    });

    it('removes a file when its remove button is clicked', async () => {
      const onFilesChange = vi.fn();
      render(
        <FileDropZone
          id="files"
          accept=".xml,.json"
          files={[xmlFile, jsonFile]}
          onFilesChange={onFilesChange}
        />,
      );

      await userEvent.click(
        screen.getByRole('button', { name: /remove report\.xml/i }),
      );

      expect(onFilesChange).toHaveBeenCalledWith([jsonFile]);
    });
  });
});
