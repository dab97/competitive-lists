export interface SubjectScore {
  name: string;
  score: number;
}

export interface Applicant {
  fullName: string;
  subjects: SubjectScore[];
  subjectsSum: number;
  achievementScore: number;
  totalScore: number;
  hasConsent?: boolean;
  hasPreference?: boolean;
  priorities: string[];
  program: string;
  status: 'admitted' | 'pending' | 'rejected';
  russianScore: number;
}

export interface Program {
  id: string;
  name: string;
  form: string;
  places: number;
  keywords: string[];
}
