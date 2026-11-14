/**
 * apps/web/src/App.tsx
 * Complete Application Routing & Entrypoint for NEURO-SPEECH (M6).
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { LanguageProvider } from './hooks/useLanguage';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider } from './hooks/useToast';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { AboutPage } from './pages/public/AboutPage';
import { TechnologyPage } from './pages/public/TechnologyPage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { ContactPage } from './pages/public/ContactPage';
import { PrivacyPage } from './pages/public/PrivacyPage';
import { TermsPage } from './pages/public/TermsPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// User Application
import { AppLayout } from './pages/app/AppLayout';
import { UserDashboardPage } from './pages/app/UserDashboardPage';
import { NeuroStudioPage } from './pages/app/NeuroStudioPage';
import { SurvivalPage } from './pages/app/SurvivalPage';
import { HistoryPage } from './pages/app/HistoryPage';
import { SessionsPage } from './pages/app/SessionsPage';
import { ProfilePage } from './pages/app/ProfilePage';
import { SettingsPage } from './pages/app/SettingsPage';

// Admin Dashboard
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminPatientsPage } from './pages/admin/AdminPatientsPage';
import { AdminDatasetsPage } from './pages/admin/AdminDatasetsPage';
import { AdminModelsPage } from './pages/admin/AdminModelsPage';
import { AdminSessionsPage } from './pages/admin/AdminSessionsPage';
import { AdminLogsPage } from './pages/admin/AdminLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <BrowserRouter>
            <Routes>
          {/* Public Website */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/technology" element={<TechnologyPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Authenticated User Application */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboardPage />} />
            <Route path="studio" element={<NeuroStudioPage />} />
            <Route path="survival" element={<SurvivalPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Admin Dashboard (RBAC Protected) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="patients" element={<AdminPatientsPage />} />
            <Route path="datasets" element={<AdminDatasetsPage />} />
            <Route path="models" element={<AdminModelsPage />} />
            <Route path="sessions" element={<AdminSessionsPage />} />
            <Route path="logs" element={<AdminLogsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </LanguageProvider>
    </ThemeProvider>
  </AuthProvider>
  );
};

export default App;
