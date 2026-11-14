import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SuggestionStrip } from '../components/SuggestionStrip';

describe('SuggestionStrip Component', () => {
  it('renders placeholder when no candidates are available', () => {
    render(
      <SuggestionStrip
        candidates={[]}
        highlightedIndex={0}
        kOfN="0/0"
      />
    );
    expect(screen.getByTestId('suggestion-strip-empty')).toBeInTheDocument();
    expect(screen.getByText(/Layer 2 Language Suggestions/i)).toBeInTheDocument();
  });

  it('renders up to 5 candidates with highlighted active word', () => {
    const candidates = ['tôi', 'tốt', 'toàn'];
    render(
      <SuggestionStrip
        candidates={candidates}
        highlightedIndex={1}
        kOfN="2/3"
      />
    );

    expect(screen.getByTestId('suggestion-strip')).toBeInTheDocument();
    expect(screen.getByText(/AI Suggestions \(2\/3\)/i)).toBeInTheDocument();

    const chip0 = screen.getByTestId('suggestion-candidate-0');
    const chip1 = screen.getByTestId('suggestion-candidate-1');
    const chip2 = screen.getByTestId('suggestion-candidate-2');

    expect(chip0).toHaveTextContent('tôi');
    expect(chip0).toHaveAttribute('data-highlighted', 'false');

    expect(chip1).toHaveTextContent('tốt');
    expect(chip1).toHaveAttribute('data-highlighted', 'true');

    expect(chip2).toHaveTextContent('toàn');
    expect(chip2).toHaveAttribute('data-highlighted', 'false');
  });

  it('triggers onCycleNext and onAccept actions', () => {
    const handleNext = vi.fn();
    const handleAccept = vi.fn();
    const handleSelect = vi.fn();

    render(
      <SuggestionStrip
        candidates={['muốn', 'mệt']}
        highlightedIndex={0}
        kOfN="1/2"
        onCycleNext={handleNext}
        onAccept={handleAccept}
        onSelectCandidate={handleSelect}
      />
    );

    // Click NEXT
    const nextBtn = screen.getByText(/NEXT \(k\/n\)/i);
    fireEvent.click(nextBtn);
    expect(handleNext).toHaveBeenCalledTimes(1);

    // Click ACCEPT
    const acceptBtn = screen.getByText('ACCEPT');
    fireEvent.click(acceptBtn);
    expect(handleAccept).toHaveBeenCalledTimes(1);

    // Click candidate directly
    const candidateChip = screen.getByTestId('suggestion-candidate-0');
    fireEvent.click(candidateChip);
    expect(handleSelect).toHaveBeenCalledWith('muốn', 0);
  });
});
