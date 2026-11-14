import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Tab3Survival } from '../components/Tab3Survival';

describe('Tab3Survival Component', () => {
  it('renders all 4 survival cards (F1–F4) with default Vietnamese phrases', () => {
    render(<Tab3Survival />);
    expect(screen.getByTestId('survival-card-F1')).toHaveTextContent('Tôi muốn uống nước.');
    expect(screen.getByTestId('survival-card-F2')).toHaveTextContent('Tôi muốn ăn.');
    expect(screen.getByTestId('survival-card-F3')).toHaveTextContent('Tôi cần trợ giúp khẩn cấp.');
    expect(screen.getByTestId('survival-card-F4')).toHaveTextContent('Tôi muốn đi vệ sinh.');
  });

  it('triggers 5-second cancel countdown on F1 selection and allows cancel', () => {
    const auditMock = vi.fn();
    render(<Tab3Survival onAuditAction={auditMock} />);

    // Click F1 card
    fireEvent.click(screen.getByTestId('survival-card-F1'));

    // Countdown banner should be visible
    expect(screen.getByTestId('countdown-banner')).toBeInTheDocument();
    expect(screen.getByText(/5s remaining to cancel/i)).toBeInTheDocument();

    // Click CANCEL button
    const cancelBtn = screen.getByTestId('cancel-countdown-btn');
    fireEvent.click(cancelBtn);

    // Banner should disappear
    expect(screen.queryByTestId('countdown-banner')).not.toBeInTheDocument();
    expect(auditMock).toHaveBeenCalledWith('SURVIVAL_CANCELLED', expect.any(Object));
  });

  it('requires two-step confirmation for high-stakes F3 Urgent Help', () => {
    const auditMock = vi.fn();
    render(<Tab3Survival onAuditAction={auditMock} />);

    // Step 1: Click F3
    fireEvent.click(screen.getByTestId('survival-card-F3'));

    // Banner shows armed step 1
    expect(screen.getByTestId('countdown-banner')).toBeInTheDocument();
    expect(screen.getByText(/F3 ARMED \(Step 1\)/i)).toBeInTheDocument();
    expect(screen.getByTestId('f3-confirm-step2')).toBeInTheDocument();

    // Step 2: Click confirm step 2
    fireEvent.click(screen.getByTestId('f3-confirm-step2'));

    // Committed
    expect(auditMock).toHaveBeenCalledWith('SURVIVAL_PHRASE_COMMITTED', expect.objectContaining({ slot: 'F3' }));
  });

  it('renders BCI CSV auto-decoder section with custom CSV uploader only (presets removed)', () => {
    render(<Tab3Survival />);
    expect(screen.getByText(/Bộ Nạp File .CSV & Tự Động Giải Mã Ý Định Sinh Tồn BCI/i)).toBeInTheDocument();
    expect(screen.getByText(/Nạp Tệp .CSV Bất Kỳ Từ Máy Tính/i)).toBeInTheDocument();
    expect(screen.queryByText(/F1: Uống Nước/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tín Hiệu Kém \/ Nhiễu/i)).not.toBeInTheDocument();
  });
});
