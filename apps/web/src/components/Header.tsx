import React, { useState } from 'react';
import { Activity, Bell, Cpu, Radio, UserCheck, Shield, HardDrive } from 'lucide-react';
import { ModeBadge } from '../types';

export type ActiveTabType = 'tab1' | 'tab2' | 'tab3' | 'tab4';

interface HeaderProps {
  modeBadge?: ModeBadge;
  splitName?: string;
  isPreEpoched?: boolean;
  isConnected: boolean;
  staffOverrideActive: boolean;
  onToggleStaffOverride: () => void;
  activeTab: ActiveTabType;
  onSelectTab: (tab: ActiveTabType) => void;
  currentUser?: { username: string; role: string; full_name: string } | null;
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  modeBadge = 'REAL DATASET REPLAY',
  splitName = 'Session 2 (Held-out Test)',
  isPreEpoched = false,
  isConnected,
  staffOverrideActive,
  onToggleStaffOverride,
  activeTab,
  onSelectTab,
  currentUser,
  onOpenAuthModal,
}) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="bg-neuro-panel border-b border-gray-800 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-neuro-bg flex items-center justify-center border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            {!logoError ? (
              <img
                src="/brand_logo.jpg"
                alt="NEURO-SPEECH Logo"
                className="w-full h-full object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              <img
                src="/logo.svg"
                alt="NEURO-SPEECH Fallback Logo"
                className="w-8 h-8 object-contain"
              />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                NEURO-SPEECH
              </h1>
              <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800 font-mono">
                v2.1
              </span>
            </div>
            <p className="text-xs text-neuro-textMuted tracking-wide">
              Non-Invasive P300 BCI Assistive Communication System
            </p>
          </div>
        </div>

        {/* Tab Navigation (Tabs 1 through 4) */}
        <div className="flex flex-wrap items-center bg-neuro-bg p-1 rounded-lg border border-gray-800 gap-1">
          <button
            onClick={() => onSelectTab('tab1')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center space-x-1 ${
              activeTab === 'tab1'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)] font-bold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Tab 1: Monitoring</span>
          </button>
          <button
            onClick={() => onSelectTab('tab2')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center space-x-1 ${
              activeTab === 'tab2'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-[0_0_8px_rgba(139,92,246,0.2)] font-bold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Tab 2: Neural Speller</span>
          </button>
          <button
            onClick={() => onSelectTab('tab3')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center space-x-1 ${
              activeTab === 'tab3'
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.2)] font-bold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-red-400" />
            <span>Tab 3: Survival (F1–F4)</span>
          </button>
          <button
            onClick={() => onSelectTab('tab4')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center space-x-1 ${
              activeTab === 'tab4'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)] font-bold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tab 4: Models</span>
          </button>
        </div>

        {/* Badges, Role & Telemetry Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Badge */}
          <div
            className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 border ${
              modeBadge === 'REAL DATASET REPLAY'
                ? 'bg-emerald-950/70 text-emerald-400 border-emerald-600/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : modeBadge === 'SYNTHETIC SIMULATION'
                ? 'bg-amber-950/70 text-amber-400 border-amber-600/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-gray-800 text-gray-400 border-gray-700'
            }`}
            data-testid="mode-badge"
          >
            <Radio className="w-3 h-3 animate-pulse" />
            <span>{modeBadge}</span>
          </div>

          {/* Held-Out Split Badge */}
          {splitName && (
            <span
              className="text-xs font-mono px-2 py-1 rounded bg-gray-800/80 text-gray-300 border border-gray-700"
              data-testid="split-badge"
            >
              {splitName}
            </span>
          )}

          {/* Pre-Epoched Badge if applicable */}
          {isPreEpoched && (
            <span
              className="text-xs font-mono px-2 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-700"
              data-testid="pre-epoched-badge"
            >
              PRE-EPOCHED
            </span>
          )}

          {/* Connection Status */}
          <div
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-mono border ${
              isConnected
                ? 'bg-cyan-950/40 text-cyan-400 border-cyan-800'
                : 'bg-red-950/40 text-red-400 border-red-800'
            }`}
            data-testid="connection-indicator"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-cyan-400 animate-ping' : 'bg-red-500'
              }`}
            />
            <span>{isConnected ? 'ONLINE (127.0.0.1)' : 'OFFLINE'}</span>
          </div>

          {/* User Auth / Role Button */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono border bg-neuro-bg hover:border-cyan-500 text-gray-300 transition-colors"
            title="Manage offline session and user roles (admin, researcher, caregiver)"
            data-testid="auth-role-btn"
          >
            <Shield className="w-3 h-3 text-cyan-400" />
            <span>Role: {currentUser ? currentUser.role.toUpperCase() : 'GUEST'}</span>
          </button>

          {/* Staff Override Toggle */}
          <button
            onClick={onToggleStaffOverride}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded text-xs font-semibold border transition-all ${
              staffOverrideActive
                ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-gray-800/60 text-gray-400 border-gray-700 hover:border-gray-500'
            }`}
            title="Toggle staff override for emergency control & testing"
            data-testid="staff-override-toggle"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Staff Override: {staffOverrideActive ? 'ACTIVE' : 'OFF'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
