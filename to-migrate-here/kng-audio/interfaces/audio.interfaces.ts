// ✅ Interfaces et types pour le module audio

export interface RecordedAudioOutput {
  blob: Blob;
  title: string;
  duration: number;
  waveformData?: number[];
}

export enum ErrorCase {
  USER_CONSENT_FAILED = 'USER_CONSENT_FAILED',
  RECORDER_TIMEOUT = 'RECORDER_TIMEOUT',
  ALREADY_RECORDING = 'ALREADY_RECORDING',
  HARDWARE_ERROR = 'HARDWARE_ERROR',
  BROWSER_NOT_SUPPORTED = 'BROWSER_NOT_SUPPORTED',
  UPLOAD_FAILED = 'UPLOAD_FAILED'
}

export enum RecorderState {
  RECORDING = "RECORDING",
  SILENCE = "SILENCE",
  PAUSED = "PAUSED",
  STOPPED = "STOPPED",
  PROCESSING = "PROCESSING"
}

export interface AudioActivityData {
  volume: number;
  frequency: number;
  timestamp: number;
  isActive: boolean;
}

export interface AudioError {
  case: ErrorCase;
  message: string;
  retry?: boolean;
  technical?: string;
  instructions?: string; // ✅ NOUVEAU : Instructions détaillées pour l'utilisateur
}

export type AudioNoteType = 'item' | 'support' | 'helper'|'prompt';

export interface AudioNoteState {
  chunkIndex: number;
  isRecording: boolean;
  isProcessing: boolean;
  hasError: boolean;
  errorMessage?: string;
  canRetry: boolean;
  hasAudio: boolean;
  started: boolean;
  transcription?: string;
  duration?: number;
  waveformData?: number[];
}

export interface AudioRecordingOptions {
  timeout?: number;
  timeSlice?: number;
  onChunk?: (data: {typedBlob: Blob, base64: string}) => void;
  stopOnSilence?: boolean;
  quality?: 'low' | 'medium' | 'high';
}

export interface AudioVisualizerConfig {
  width?: number;
  height?: number;
  showRealtime?: boolean;
  showWaveform?: boolean;
  showVolumeMeter?: boolean;
  showActivity?: boolean;
  barCount?: number;
  smoothing?: number;
}

export interface AudioNoteConfig {
  type: AudioNoteType;
  instanceId?: string;
  hasCustomTitle?: boolean;
  hasCustomDescription?: boolean;
  hasCustomResponse?: boolean;
  filename?: string;
  uploadKey?: string;
  amount?: number;
  includeCartContext?: boolean;
}
