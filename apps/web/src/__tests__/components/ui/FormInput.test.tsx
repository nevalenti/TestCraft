import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormInput } from '@/components/ui/FormInput';

describe('FormInput', () => {
  describe('given no props — renders a basic input', () => {
    it('renders an input element', () => {
      render(<FormInput />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(<FormInput />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('input');
      expect(input.className).toContain('input-bordered');
      expect(input.className).toContain('w-full');
    });
  });

  describe('given no hasError prop — does not apply error class', () => {
    it('omits input-error class', () => {
      render(<FormInput />);
      expect(screen.getByRole('textbox').className).not.toContain(
        'input-error',
      );
    });
  });

  describe('given hasError={true} — applies error class', () => {
    it('adds input-error class', () => {
      render(<FormInput hasError />);
      expect(screen.getByRole('textbox').className).toContain('input-error');
    });
  });

  describe('given standard input props — passes them through', () => {
    it('sets placeholder', () => {
      render(<FormInput placeholder="Enter name" />);
      expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
    });

    it('sets type', () => {
      render(<FormInput type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('sets disabled', () => {
      render(<FormInput disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  describe('given a custom className — merges with base classes', () => {
    it('includes the custom class alongside base classes', () => {
      render(<FormInput className="font-bold" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('font-bold');
      expect(input.className).toContain('input');
    });
  });
});
