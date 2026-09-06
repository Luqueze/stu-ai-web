export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';
export type ExamStatus = 'PENDING' | 'READY' | 'FAILED';
export type FailureReason = 'TIMEOUT' | 'QUOTA_EXCEEDED' | 'LLM_ERROR' | 'INVALID_RESPONSE' | 'UNKNOWN';

export interface CreateExamRequest {
  theme: string;
  questionCount: number;
  difficulty: DifficultyLevel;
  durationMinutes: number;
}

export interface ExamQuestionResponse {
  statement: string;
  options: string[];
  correctOptionIndex: number;
}

export interface ExamResponse {
  id: string;
  theme: string;
  questionCount: number;
  difficulty: DifficultyLevel;
  status: ExamStatus;
  failureReason: FailureReason | null;
  failureMessage: string | null;
  durationMinutes: number;
  createdAt: string;
  questions: ExamQuestionResponse[] | null;
}
