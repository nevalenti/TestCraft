import { TestRunStatus } from '@testcraft/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RunForm } from '@/features/testRuns/RunForm';

describe('RunForm', () => {
  describe('given no defaultValues — renders empty name and environment fields', () => {
    it('name input is empty', () => {
      render(
        <RunForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      );
      expect(screen.getByLabelText('Name')).toHaveValue('');
    });

    it('environment input is empty', () => {
      render(
        <RunForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      );
      expect(screen.getByLabelText('Environment')).toHaveValue('');
    });

    it('status defaults to Active', () => {
      render(
        <RunForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      );
      expect(screen.getByLabelText('Status')).toHaveValue(TestRunStatus.Active);
    });
  });

  describe('given defaultValues — pre-fills the fields', () => {
    it('sets the name value', () => {
      render(
        <RunForm
          defaultValues={{
            name: 'Sprint 42',
            environment: 'staging',
            status: TestRunStatus.Active,
          }}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          isLoading={false}
        />,
      );
      expect(screen.getByLabelText('Name')).toHaveValue('Sprint 42');
    });

    it('sets the environment value', () => {
      render(
        <RunForm
          defaultValues={{
            name: 'Sprint 42',
            environment: 'staging',
            status: TestRunStatus.Active,
          }}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          isLoading={false}
        />,
      );
      expect(screen.getByLabelText('Environment')).toHaveValue('staging');
    });
  });

  describe('when submitted — calls onSubmit with entered values', () => {
    it('passes name, environment, and status', async () => {
      const onSubmit = vi.fn();

      render(
        <RunForm onSubmit={onSubmit} onCancel={vi.fn()} isLoading={false} />,
      );
      await userEvent.type(screen.getByLabelText('Name'), 'Sprint 42');
      await userEvent.type(screen.getByLabelText('Environment'), 'staging');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Sprint 42',
        environment: 'staging',
        status: TestRunStatus.Active,
      });
    });
  });

  describe('when Cancel is clicked — calls onCancel', () => {
    it('invokes onCancel once', async () => {
      const onCancel = vi.fn();

      render(
        <RunForm onSubmit={vi.fn()} onCancel={onCancel} isLoading={false} />,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onCancel).toHaveBeenCalledOnce();
    });
  });
});
