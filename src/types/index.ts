export interface SubjectScore {
  name: string;
  score: number;
}

export interface ProgramScore {
  totalScore: number;
  subjectsSum: number;
  achievementScore: number;
  subjects: SubjectScore[];
  /** Priority rank declared by the applicant for this program (from the source file column) */
  priorityRank: number;
}

export interface Applicant {
  id?: string;
  fullName: string;
  phone?: string;
  email?: string;
  subjects: SubjectScore[];
  subjectsSum: number;
  achievementScore: number;
  totalScore: number;
  hasConsent?: boolean;
  hasPreference?: boolean;
  priorities: string[];
  program: string;
  status: 'admitted' | 'pending' | 'rejected' | 'admitted_elsewhere';
  russianScore: number;
  /** Per-program scores keyed by programId */
  programScores: Record<string, ProgramScore>;
  /** Set when status=admitted_elsewhere — which programId they were admitted to */
  admittedToProgramId?: string;
  /** True if applicant submitted a formal refusal */
  hasRefusal?: boolean;
}

export interface Program {
  id: string;
  name: string;
  form: string;
  places: number;
  keywords: string[];
}
