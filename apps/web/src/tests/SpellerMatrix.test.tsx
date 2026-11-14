import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SpellerMatrix } from '../components/SpellerMatrix';

describe('SpellerMatrix Component', () => {
  it('renders all 36 cells in a 6x6 matrix layout', () => {
    render(<SpellerMatrix />);
    const matrix = screen.getByTestId('speller-matrix');
    expect(matrix).toBeInTheDocument();

    // Verify cell characters
    expect(screen.getByTestId('matrix-cell-0-0')).toHaveTextContent('A');
    expect(screen.getByTestId('matrix-cell-0-5')).toHaveTextContent('F');
    expect(screen.getByTestId('matrix-cell-5-0')).toHaveTextContent('5');
    expect(screen.getByTestId('matrix-cell-5-5')).toHaveTextContent('␣'); // '_' rendered as space symbol
  });

  it('highlights entire row when row flash event arrives (activeFlashGroup 1..6)', () => {
    // activeFlashGroup = 2 (Row 2: G H I J K L)
    render(<SpellerMatrix activeFlashGroup={2} />);

    // Row 2 cells should have data-flashing="true"
    expect(screen.getByTestId('matrix-cell-1-0')).toHaveAttribute('data-flashing', 'true');
    expect(screen.getByTestId('matrix-cell-1-3')).toHaveAttribute('data-flashing', 'true');

    // Row 1 and Row 3 cells should NOT be flashing
    expect(screen.getByTestId('matrix-cell-0-0')).toHaveAttribute('data-flashing', 'false');
    expect(screen.getByTestId('matrix-cell-2-0')).toHaveAttribute('data-flashing', 'false');
  });

  it('highlights entire column when column flash event arrives (activeFlashGroup 7..12)', () => {
    // activeFlashGroup = 9 (Column 3: C, I, O, U, 3, 7) -> (9 - 7 = 2 index)
    render(<SpellerMatrix activeFlashGroup={9} />);

    // Col 3 (index 2) cells should have data-flashing="true"
    expect(screen.getByTestId('matrix-cell-0-2')).toHaveAttribute('data-flashing', 'true'); // C
    expect(screen.getByTestId('matrix-cell-2-2')).toHaveAttribute('data-flashing', 'true'); // O

    // Col 1 cells should NOT be flashing
    expect(screen.getByTestId('matrix-cell-0-0')).toHaveAttribute('data-flashing', 'false');
    expect(screen.getByTestId('matrix-cell-1-1')).toHaveAttribute('data-flashing', 'false');
  });

  it('invokes onCellClick when a matrix cell is clicked', () => {
    const handleCellClick = vi.fn();
    render(<SpellerMatrix onCellClick={handleCellClick} />);

    const cellB = screen.getByTestId('matrix-cell-0-1'); // Row 1, Col 2 -> 'B'
    fireEvent.click(cellB);

    expect(handleCellClick).toHaveBeenCalledWith(1, 2, 'B');
  });
});
