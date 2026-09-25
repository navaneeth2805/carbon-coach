/**
 * Common Types for Food Detection APIs & Fusion
 */

export interface DetectionPayload {
  dishName: string;
  matchedDishId?: string;
  confidence: number; // 0 to 1.0
  estimatedPortionGrams: number;
  category?: string;
  notes?: string;
}

export type DetectorSource = 'gemini' | 'custom_model';

export type DetectorErrorCode =
  | 'MISSING_API_KEY'
  | 'ENDPOINT_NOT_CONFIGURED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'PARSE_ERROR';

export interface DetectorResultSuccess {
  status: 'success';
  source: DetectorSource;
  data: DetectionPayload;
  latencyMs: number;
}

export interface DetectorResultError {
  status: 'error';
  source: DetectorSource;
  code: DetectorErrorCode;
  message: string;
  latencyMs?: number;
}

export type DetectorResult = DetectorResultSuccess | DetectorResultError;

export type FusionStatus =
  | 'agreement'
  | 'disagreement'
  | 'gemini_only'
  | 'custom_only'
  | 'both_failed';

export interface FusedDetectionResult {
  status: FusionStatus;
  primary: DetectionPayload | null;
  secondary: DetectionPayload | null;
  geminiResult: DetectorResult;
  customResult: DetectorResult;
  errorMessage?: string;
}
