/**
 * Forge Builder AI — public exports
 */

export { AIEngine, getServerAIEngine } from './engine';
export type { AIProviderName, AIStatusDetail, ModelInfo } from './engine';
export { runSAST, calculateScore } from './sast';
export { detectDrift } from './drift-detector';
export { generateSuggestions } from './auto-suggest';
export { FORGE_BUILDER_SYSTEM_PROMPT, buildContextBlock } from './system-prompt';
export { runLearningCycle, isOnline, LEARNING_SOURCES } from './self-learner';
export {
  upsertKnowledge,
  getRelevantKnowledge,
  getKnowledgeSummary,
  getLearnLog,
  recordBuilderPattern,
  getTopBuilderPatterns,
} from './knowledge-store';
export type {
  ChatMessage,
  SASTFinding,
  DriftFinding,
  AnalysisResult,
  AutoSuggestion,
  AIStatus,
  GenerateOptions,
} from './types';
