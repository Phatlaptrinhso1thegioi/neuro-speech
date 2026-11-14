/**
 * apps/web/src/tests/LandingPage.test.tsx
 * Automated test suite for Public Landing Page (M6).
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from '../pages/public/LandingPage';
import { AuthProvider } from '../hooks/useAuth';

describe('LandingPage Component (M6)', () => {
  it('renders hero headline, pipeline steps, and disclaimers correctly', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      </AuthProvider>
    );

    // Verify Hero title
    expect(screen.getByText(/Giao tiếp Tiếng Việt qua/i)).toBeInTheDocument();
    expect(screen.getByText(/Tín hiệu Sóng não P300/i)).toBeInTheDocument();

    // Verify CTAs
    expect(screen.getByText(/Bắt đầu Trải nghiệm/i)).toBeInTheDocument();
    expect(screen.getByText(/Tìm hiểu Công nghệ/i)).toBeInTheDocument();

    // Verify pipeline steps
    expect(screen.getByText(/Thu nhận EEG 16 Kênh/i)).toBeInTheDocument();
    expect(screen.getByText(/Giải mã Shrinkage LDA/i)).toBeInTheDocument();
    expect(screen.getByText(/Bộ đệm Telex Tiếng Việt/i)).toBeInTheDocument();
    expect(screen.getByText(/Cổng Xác nhận Rõ ràng/i)).toBeInTheDocument();

    // Verify mandatory medical disclaimer
    expect(screen.getByText(/Lưu ý Y tế Bắt buộc/i)).toBeInTheDocument();
  });
});
