import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../components/Header';

describe('Header Component', () => {
  it('renders brand title and authentic mode badges', () => {
    const handleToggle = vi.fn();
    const handleSelectTab = vi.fn();

    render(
      <Header
        modeBadge="REAL DATASET REPLAY"
        splitName="Session 2 (Held-out Test)"
        isPreEpoched={true}
        isConnected={true}
        staffOverrideActive={false}
        onToggleStaffOverride={handleToggle}
        activeTab="tab1"
        onSelectTab={handleSelectTab}
      />
    );

    expect(screen.getByText('NEURO-SPEECH')).toBeInTheDocument();
    expect(screen.getByTestId('mode-badge')).toHaveTextContent('REAL DATASET REPLAY');
    expect(screen.getByTestId('split-badge')).toHaveTextContent('Session 2 (Held-out Test)');
    expect(screen.getByTestId('pre-epoched-badge')).toHaveTextContent('PRE-EPOCHED');
    expect(screen.getByTestId('connection-indicator')).toHaveTextContent('ONLINE');
  });

  it('toggles staff override on button click', () => {
    const handleToggle = vi.fn();
    const handleSelectTab = vi.fn();

    render(
      <Header
        modeBadge="REAL DATASET REPLAY"
        isConnected={true}
        staffOverrideActive={false}
        onToggleStaffOverride={handleToggle}
        activeTab="tab1"
        onSelectTab={handleSelectTab}
      />
    );

    const toggleBtn = screen.getByTestId('staff-override-toggle');
    expect(toggleBtn).toHaveTextContent('Staff Override: OFF');

    fireEvent.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('switches between tabs', () => {
    const handleToggle = vi.fn();
    const handleSelectTab = vi.fn();

    render(
      <Header
        modeBadge="REAL DATASET REPLAY"
        isConnected={true}
        staffOverrideActive={false}
        onToggleStaffOverride={handleToggle}
        activeTab="tab1"
        onSelectTab={handleSelectTab}
      />
    );

    const tab2Btn = screen.getByText(/Tab 2: Neural Speller/i);
    fireEvent.click(tab2Btn);
    expect(handleSelectTab).toHaveBeenCalledWith('tab2');

    const tab3Btn = screen.getByText(/Tab 3: Survival/i);
    fireEvent.click(tab3Btn);
    expect(handleSelectTab).toHaveBeenCalledWith('tab3');

    const tab4Btn = screen.getByText(/Tab 4: Models/i);
    fireEvent.click(tab4Btn);
    expect(handleSelectTab).toHaveBeenCalledWith('tab4');
  });
});
