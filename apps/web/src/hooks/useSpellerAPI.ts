import { useState, useEffect, useCallback } from 'react';
import { SpellerState } from '../types';

const defaultSpellerState: SpellerState = {
  state: 'SPELLING',
  raw_word_buffer: '',
  telex_word_buffer: '',
  sentence_buffer: [],
  confirmed_sentence: '',
  full_display_text: '',
  candidates: [],
  highlighted_index: 0,
  highlighted_word: null,
  k_of_n: '0/0',
  suggestions_displayed_timestamp: null,
  armed_action: null,
  vietnamese_mode: true,
  just_accepted: false,
};

export interface TargetEvalResult {
  row: number;
  col: number;
  char: string;
  score: number;
  confidence: number;
  latency_ms: number;
  model: string;
}

export interface SpellerActionResponse extends SpellerState {
  status?: string;
  reason?: string;
}

const sanitizeSource = (source?: unknown, fallback: string = 'staff_override'): string =>
  typeof source === 'string' && source.trim().length > 0 ? source : fallback;

export function useSpellerAPI() {
  const [spellerState, setSpellerState] = useState<SpellerState>(defaultSpellerState);
  const [loading, setLoading] = useState(false);

  const apiBase = '/api/v1/speller';

  const fetchState = useCallback(async () => {
    try {
      const resp = await fetch(`${apiBase}/state`);
      if (resp.ok) {
        const data = await resp.json();
        setSpellerState(data);
      }
    } catch {
      // Backend not yet reached; keep current state
    }
  }, [apiBase]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const inputCharacter = async (
    letter: string,
    source: string = 'decoded'
  ): Promise<SpellerActionResponse | null> => {
    setLoading(true);
    try {
      const resp = await fetch(`${apiBase}/decode-character`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letter, source: sanitizeSource(source, 'decoded') }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setSpellerState(data);
        return data;
      }
    } catch (err) {
      console.error('Failed to input character:', err);
    } finally {
      setLoading(false);
    }
    return null;
  };

  const decodeSequence = async (
    text: string,
    clearFirst: boolean = true,
    source: string = 'decoded'
  ): Promise<SpellerActionResponse | null> => {
    setLoading(true);
    try {
      const resp = await fetch(`${apiBase}/decode-sequence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          clear_first: clearFirst,
          source: sanitizeSource(source, 'decoded'),
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setSpellerState(data);
        return data;
      }
    } catch (err) {
      console.error('Failed to decode sequence:', err);
    } finally {
      setLoading(false);
    }
    return null;
  };

  const evaluateTargetCell = async (
    row: number,
    col: number,
    char: string
  ): Promise<TargetEvalResult | null> => {
    try {
      const resp = await fetch('/api/v1/p300/evaluate-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row, col, char }),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (err) {
      console.error('Failed to evaluate target cell:', err);
    }
    return null;
  };

  const acceptSuggestion = async (
    source: string = 'staff_override',
    candidateIndex?: number
  ): Promise<SpellerActionResponse | null> => {
    try {
      const resp = await fetch(`${apiBase}/accept-suggestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: sanitizeSource(source),
          candidate_index: typeof candidateIndex === 'number' ? candidateIndex : undefined,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setSpellerState(data);
        return data;
      }
    } catch (err) {
      console.error('Failed to accept suggestion:', err);
    }
    return null;
  };

  const rejectSuggestion = async (
    source: string = 'staff_override'
  ): Promise<SpellerActionResponse | null> => {
    try {
      const resp = await fetch(`${apiBase}/reject-suggestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: sanitizeSource(source) }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setSpellerState(data);
        return data;
      }
    } catch (err) {
      console.error('Failed to reject suggestion:', err);
    }
    return null;
  };

  const nextSuggestion = async (
    source: string = 'staff_override'
  ): Promise<SpellerActionResponse | null> => {
    try {
      const resp = await fetch(`${apiBase}/next-suggestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: sanitizeSource(source) }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setSpellerState(data);
        return data;
      }
    } catch (err) {
      console.error('Failed to cycle suggestion:', err);
    }
    return null;
  };

  const backspace = async (
    source: string = 'staff_override'
  ): Promise<SpellerActionResponse | null> => {
    try {
      const resp = await fetch(`${apiBase}/backspace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: sanitizeSource(source) }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setSpellerState(data);
        return data;
      }
    } catch (err) {
      console.error('Failed backspace:', err);
    }
    return null;
  };

  const clear = async (
    source: string = 'staff_override'
  ): Promise<SpellerActionResponse | null> => {
    try {
      const resp = await fetch(`${apiBase}/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: sanitizeSource(source) }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setSpellerState(data);
        return data;
      }
    } catch (err) {
      console.error('Failed clear:', err);
    }
    return null;
  };

  const highStakes = async (
    actionId: string,
    source: string = 'decoded'
  ): Promise<SpellerActionResponse | null> => {
    try {
      const resp = await fetch(`${apiBase}/high-stakes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_id: actionId,
          source: sanitizeSource(source, 'decoded'),
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setSpellerState(data);
        return data;
      }
    } catch (err) {
      console.error('Failed high stakes action:', err);
    }
    return null;
  };

  return {
    spellerState,
    loading,
    fetchState,
    inputCharacter,
    decodeSequence,
    evaluateTargetCell,
    acceptSuggestion,
    rejectSuggestion,
    nextSuggestion,
    backspace,
    clear,
    highStakes,
  };
}
