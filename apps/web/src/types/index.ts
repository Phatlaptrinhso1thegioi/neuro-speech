/**
 * Types for NEURO-SPEECH BCI Platform Frontend (M6).
 */

export type ModeBadge = 'REAL DATASET REPLAY' | 'SYNTHETIC SIMULATION' | 'LIVE HARDWARE';

export interface TelemetryMetrics {
  preprocessingLatencyMs: number;
  inferenceMedianMs: number;
  inferenceP95Ms: number;
  epochWindowMs: number;
  sequenceDurationS: number;
  totalSelectionTimeS: number;
}

export interface ReplayChunk {
  type: string;
  session_id: string;
  current_timestamp: number;
  sample_start_idx: number;
  sample_end_idx: number;
  channel_samples: Record<string, number[]>;
  events_in_chunk: Array<{
    sample: number;
    code: number;
    name: string;
    description: string;
  }>;
  total_samples: number;
  total_duration_s: number;
  is_running: boolean;
}

export interface DecodedRecord {
  trial_index: number;
  expected_ground_truth?: string;
  raw_predicted_char: string;
  ai_suggested_word?: string;
  final_confirmed_output?: string;
  winning_row: number;
  winning_col: number;
  row_score: number;
  col_score: number;
  repetitions: number;
  inference_latency_ms: number;
  source: 'neural_decoder' | 'staff_override';
  timestamp: number;
}

export interface SpellerState {
  state: 'SPELLING' | 'SUGGESTION_AVAILABLE' | 'WAITING_FOR_USER_DECISION' | 'WORD_ACCEPTED';
  raw_word_buffer: string;
  telex_word_buffer: string;
  sentence_buffer: string[];
  confirmed_sentence: string;
  full_display_text: string;
  candidates: string[];
  highlighted_index: number;
  highlighted_word: string | null;
  k_of_n: string;
  suggestions_displayed_timestamp: number | null;
  armed_action: string | null;
  vietnamese_mode: boolean;
  just_accepted: boolean;
}

export interface FourWayEntry {
  step: string;
  groundTruth: string;
  predicted: string;
  aiSuggested: string;
  confirmed: string;
  source: 'neural_decoder' | 'staff_override';
  state: string;
  latencyMs: number;
  gridPos?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'researcher' | 'caregiver';
  full_name: string;
  is_active?: boolean;
  created_at?: string;
}

export interface CommunicationHistoryItem {
  id: number;
  user_id: number;
  patient_id?: number;
  timestamp: string;
  mode: string;
  confirmed_text: string;
  tts_status: string;
  duration_s: number;
  data_source: string;
  model_version?: string;
  reps: number;
  created_at: string;
}

export interface EEGSessionItem {
  id: number;
  patient_id: number;
  patient_code: string;
  session_type: string;
  mode_badge: string;
  split_name?: string;
  accuracy?: number;
  duration_s: number;
  notes?: string;
  created_at: string;
}

export interface AdminStats {
  users: {
    total: number;
    active: number;
  };
  patients: {
    total: number;
  };
  sessions: {
    total: number;
  };
  models: {
    total: number;
    active: number;
  };
  jobs: {
    total: number;
  };
  audit_events: number;
  system_health: {
    status: string;
    db_mode: string;
    pipeline: string;
    version: string;
  };
}
