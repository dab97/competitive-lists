import { Applicant, Program } from '@/types';

export function compareApplicants(a: Applicant, b: Applicant): number {
  // 1. Total score (including individual achievements)
  if (b.totalScore !== a.totalScore) {
    return b.totalScore - a.totalScore;
  }

  // 2. Exam subjects sum (without individual achievements)
  if (b.subjectsSum !== a.subjectsSum) {
    return b.subjectsSum - a.subjectsSum;
  }

  // 3. Priority Subject 1 score (e.g., Biology)
  const aSub1 = a.subjects[0]?.score ?? 0;
  const bSub1 = b.subjects[0]?.score ?? 0;
  if (bSub1 !== aSub1) {
    return bSub1 - aSub1;
  }

  // 4. Priority Subject 2 score (e.g., Social Studies / Math)
  const aSub2 = a.subjects[1]?.score ?? 0;
  const bSub2 = b.subjects[1]?.score ?? 0;
  if (bSub2 !== aSub2) {
    return bSub2 - aSub2;
  }

  // 5. Priority Subject 3 score (e.g., Russian Language)
  const aSub3 = a.subjects[2]?.score ?? 0;
  const bSub3 = b.subjects[2]?.score ?? 0;
  if (bSub3 !== aSub3) {
    return bSub3 - aSub3;
  }

  // 6. Consent to enroll («Согласие на зачисление»)
  if (Boolean(a.hasConsent) !== Boolean(b.hasConsent)) {
    return a.hasConsent ? -1 : 1;
  }

  // 7. Full Name alphabetical tie breaker (A-Z)
  return a.fullName.localeCompare(b.fullName);
}

export function generateCompetitionLists(
  applicants: Applicant[],
  programs: Program[]
): Record<string, Applicant[]> {
  // 1. Determine which program each applicant is admitted to based on priority and rank
  const admittedProgramMap = new Map<string, string>(); // fullName -> admitted programId
  const programAdmittedCounts: Record<string, number> = {};
  
  programs.forEach((program) => {
    programAdmittedCounts[program.id] = 0;
  });

  const sortedApplicants = [...applicants].sort(compareApplicants);

  sortedApplicants.forEach((applicant) => {
    for (const programId of applicant.priorities) {
      const program = programs.find((p) => p.id === programId);
      if (!program) continue;

      if ((programAdmittedCounts[programId] || 0) < program.places) {
        admittedProgramMap.set(applicant.fullName, programId);
        programAdmittedCounts[programId] = (programAdmittedCounts[programId] || 0) + 1;
        break; // Admitted to highest possible priority
      }
    }
  });

  // 2. Build complete competition list for EACH program (all applicants who applied to that program)
  const competitionLists: Record<string, Applicant[]> = {};

  programs.forEach((program) => {
    const applicantsForProgram = applicants
      .filter((applicant) => applicant.priorities.includes(program.id))
      .map((applicant) => ({
        ...applicant,
        status: (admittedProgramMap.get(applicant.fullName) === program.id ? 'admitted' : 'rejected') as 'admitted' | 'rejected',
      }))
      .sort((a, b) => {
        if (a.status === b.status) {
          return compareApplicants(a, b);
        }
        return a.status === 'admitted' ? -1 : 1;
      });

    competitionLists[program.id] = applicantsForProgram;
  });

  return competitionLists;
}
