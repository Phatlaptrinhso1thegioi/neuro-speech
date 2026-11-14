import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Tab4Models } from '../components/Tab4Models';

describe('Tab4Models Component', () => {
  it('renders registered model checkpoints with metrics and status badges', () => {
    render(<Tab4Models userRole="researcher" />);

    expect(screen.getByText(/Shrinkage LDA Baseline/i)).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('candidate')).toBeInTheDocument();
  });

  it('disables retrain and upload actions for caregiver role', () => {
    render(<Tab4Models userRole="caregiver" />);

    const retrainBtn = screen.getByText(/RETRAIN MODEL/i).closest('button');
    expect(retrainBtn).toBeDisabled();

    const uploadBtn = screen.getByText('Upload').closest('button');
    expect(uploadBtn).toBeDisabled();
  });
});
