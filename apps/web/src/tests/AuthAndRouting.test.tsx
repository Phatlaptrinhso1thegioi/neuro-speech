/**
 * apps/web/src/tests/AuthAndRouting.test.tsx
 * Tests for Authentication, Forms, and Role-Based Guards (M6).
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { AdminLayout } from '../pages/admin/AdminLayout';
import { AuthProvider } from '../hooks/useAuth';

describe('Auth & Routing Tests (M6)', () => {
  it('renders login page with pre-seeded demo account buttons', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Đăng Nhập NEURO-SPEECH/i)).toBeInTheDocument();
    expect(screen.getByText(/Caregiver/i)).toBeInTheDocument();
    expect(screen.getByText(/Researcher/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin/i)).toBeInTheDocument();

    // Clicking Caregiver demo fills inputs
    fireEvent.click(screen.getByText(/Caregiver/i));
    const userInput = screen.getByPlaceholderText(/admin \/ researcher \/ caregiver/i) as HTMLInputElement;
    expect(userInput.value).toBe('caregiver');
  });

  it('renders registration form with role selection', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Tạo Tài Khoản NEURO-SPEECH/i)).toBeInTheDocument();
    expect(screen.getByText(/Người chăm sóc lâm sàng/i)).toBeInTheDocument();
    expect(screen.getByText(/Đăng Ký Tài Khoản/i)).toBeInTheDocument();
  });

  it('blocks non-admin users from accessing AdminLayout with 403 Forbidden', () => {
    // Current user in localStorage mock is caregiver
    localStorage.setItem(
      'neuro_speech_user',
      JSON.stringify({ id: 3, username: 'caregiver', role: 'caregiver', full_name: 'Caregiver Demo' })
    );

    render(
      <AuthProvider>
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/403 — Quyền Truy Cập Bị Từ Chối/i)).toBeInTheDocument();
    expect(screen.getByText(/Về Trang Cá Nhân/i)).toBeInTheDocument();
  });
});
