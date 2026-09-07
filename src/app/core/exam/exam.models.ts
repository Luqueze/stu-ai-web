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
  // Redacted (null) unless the caller is an admin or has already submitted this exam.
  correctOptionIndex: number | null;
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

export interface ExamSessionResponse {
  examId: string;
  startedAt: string;
  remainingSeconds: number;
}

export interface SubmitExamRequest {
  selectedOptions: number[];
}

export interface ExamSubmissionResponse {
  examId: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  submittedAt: string;
}

export interface ExamSubmissionSummaryResponse {
  studentEmail: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  submittedAt: string;
}
