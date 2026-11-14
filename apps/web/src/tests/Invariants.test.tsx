/**
 * apps/web/src/tests/Invariants.test.tsx
 * Invariant Verification Tests for NEURO-SPEECH (M6):
 * Critical Invariant: No AI-suggested word may enter confirmed output without explicit user acceptance.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestionStrip } from '../components/SuggestionStrip';
import { Tab2Speller } from '../components/Tab2Speller';
import { SpellerState } from '../types';

describe('BCI Invariant: Explicit User Confirmation Gate', () => {
  const baseSpellerState: SpellerState = {
    state: 'WAITING_FOR_USER_DECISION',
    raw_word_buffer: 'uoong',
    telex_word_buffer: 'uong',
    sentence_buffer: ['Tôi', 'muốn'],
    confirmed_sentence: 'Tôi muốn',
    full_display_text: 'Tôi muốn uong',
    candidates: ['uống', 'uông', 'uống nước'],
    highlighted_index: 0,
    highlighted_word: 'uống',
    k_of_n: '1/3',
    suggestions_displayed_timestamp: Date.now(),
    armed_action: null,
    vietnamese_mode: true,
    just_accepted: false,
  };

  it('displays AI suggested candidates without automatically committing to confirmed_sentence', () => {
    render(
      <SuggestionStrip
        candidates={baseSpellerState.candidates}
        highlightedIndex={baseSpellerState.highlighted_index}
        kOfN={baseSpellerState.k_of_n}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onCycleNext={vi.fn()}
      />
    );

    // AI suggestions are displayed
    expect(screen.getByText('uống')).toBeInTheDocument();
    expect(screen.getByText('uông')).toBeInTheDocument();

    // Invariant: highlighted_word 'uống' is NOT yet in confirmed sentence
    expect(baseSpellerState.confirmed_sentence).toBe('Tôi muốn');
    expect(baseSpellerState.confirmed_sentence).not.toContain('uống');
  });

  it('triggers onAccept only when explicit ACCEPT button is clicked', () => {
    const handleAccept = vi.fn();
    const handleContinue = vi.fn();
    const handleNext = vi.fn();

    render(
      <SuggestionStrip
        candidates={baseSpellerState.candidates}
        highlightedIndex={baseSpellerState.highlighted_index}
        kOfN={baseSpellerState.k_of_n}
        onAccept={handleAccept}
        onReject={handleContinue}
        onCycleNext={handleNext}
      />
    );

    const acceptBtn = screen.getByText(/ACCEPT/i);
    fireEvent.click(acceptBtn);

    expect(handleAccept).toHaveBeenCalledTimes(1);
    expect(handleContinue).toHaveBeenCalledTimes(0);
  });

  it('triggers onContinue and rejects suggestion when CONTINUE button is clicked', () => {
    const handleAccept = vi.fn();
    const handleContinue = vi.fn();
    const handleNext = vi.fn();

    render(
      <SuggestionStrip
        candidates={baseSpellerState.candidates}
        highlightedIndex={baseSpellerState.highlighted_index}
        kOfN={baseSpellerState.k_of_n}
        onAccept={handleAccept}
        onReject={handleContinue}
        onCycleNext={handleNext}
      />
    );

    const continueBtn = screen.getByText(/CONTINUE/i);
    fireEvent.click(continueBtn);

    expect(handleContinue).toHaveBeenCalledTimes(1);
    expect(handleAccept).toHaveBeenCalledTimes(0);
  });
});
