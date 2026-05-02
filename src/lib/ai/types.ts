/**
 * Forge Builder — AI Engine Types
 * Shared interfaces used across all AI subsystems.
 */

// ── Provider / model identity ──────────────────────────────────────────────

export type AIProviderName = 'ollama' | 'webllm' | 'rules-based';

export interface ModelInfo {
  provider: AIProviderName;
  modelId: string;           // e.g. "phi3:mini" or "Phi-3.5-mini-instruct-q4f16_1-MLC"
  displayName: string;
  contextLength: number;     // tokens
  offline: boolean;          // true = works with no internet after install/download
}

// ── Status ─────────────────────────────────────────────────────────────────

export type AIStatus =
  | 'uninitialized'
  | 'detecting'              // checking which providers are available
  | 'downloading'            // WebLLM model downloading
  | 'loading'                // model loading into memory
  | 'ready'
  | 'generating'
  | 'error';

export interface AIStatusDetail {
  status: AIStatus;
  provider: AIProviderName | null;
  model: ModelInfo | null;
  downloadProgress?: number; // 0-100, WebLLM only
  error?: string;
}

// ── Chat ───────────────────────────────────────────────────────────────────

export type MessageRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  provider?: AIProviderName;
}

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  signal?: AbortSignal;
}

// ── SAST (Static Analysis Security Testing) ───────────────────────────────

export type SASTSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SASTCategory =
  | 'security'
  | 'performance'
  | 'accessibility'
  | 'seo'
  | 'ux'
  | 'content'
  | 'configuration'
  | 'conversion';

export interface SASTFinding {
  id: string;
  severity: SASTSeverity;
  category: SASTCategory;
  sectionId?: string;
  sectionType?: string;
  field?: string;
  message: string;
  recommendation: string;
  cwe?: string;             // e.g. "CWE-311" for missing encryption
  wcag?: string;            // e.g. "WCAG 2.1 AA 1.1.1"
}

// ── Drift Detection ────────────────────────────────────────────────────────

export type DriftSeverity = 'info' | 'warning' | 'error';

export interface DriftFinding {
  id: string;
  sectionId: string;
  sectionType: string;
  field: string;
  currentValue: unknown;
  defaultValue: unknown;
  message: string;
  severity: DriftSeverity;
  isIntentional?: boolean;  // user has acknowledged this drift
}

// ── Analysis ───────────────────────────────────────────────────────────────

export interface AnalysisResult {
  timestamp: number;
  projectId: string;
  sast: SASTFinding[];
  drift: DriftFinding[];
  score: number;            // 0-100 composite quality score
  summary: string;
  suggestions: AutoSuggestion[];
}

// ── Auto-Suggestions ───────────────────────────────────────────────────────

export type SuggestionType =
  | 'add-section'
  | 'update-setting'
  | 'seo'
  | 'accessibility'
  | 'performance'
  | 'conversion'
  | 'content'
  | 'ux';

export interface AutoSuggestion {
  id: string;
  type: SuggestionType;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  dismissed?: boolean;
  action?: SuggestionAction;
}

export interface SuggestionAction {
  label: string;
  type: 'add-section' | 'update-setting' | 'navigate' | 'external';
  payload?: Record<string, unknown>;
}

// ── Provider interface (implemented by each backend) ──────────────────────

export interface AIProvider {
  name: AIProviderName;
  isAvailable(): Promise<boolean>;
  getStatus(): AIStatusDetail;
  initialize(onProgress?: (pct: number) => void): Promise<void>;
  chat(
    messages: ChatMessage[],
    options?: GenerateOptions
  ): Promise<string>;
  chatStream(
    messages: ChatMessage[],
    onToken: (token: string) => void,
    options?: GenerateOptions
  ): Promise<void>;
  generate(
    prompt: string,
    systemPrompt?: string,
    options?: GenerateOptions
  ): Promise<string>;
  getDefaultModel(): ModelInfo;
}
