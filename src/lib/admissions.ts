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

  // 3. Priority Subject 1 score
  const aSub1 = a.subjects[0]?.score ?? 0;
  const bSub1 = b.subjects[0]?.score ?? 0;
  if (bSub1 !== aSub1) {
    return bSub1 - aSub1;
  }

  // 4. Priority Subject 2 score
  const aSub2 = a.subjects[1]?.score ?? 0;
  const bSub2 = b.subjects[1]?.score ?? 0;
  if (bSub2 !== aSub2) {
    return bSub2 - aSub2;
  }

  // 5. Priority Subject 3 score
  const aSub3 = a.subjects[2]?.score ?? 0;
  const bSub3 = b.subjects[2]?.score ?? 0;
  if (bSub3 !== aSub3) {
    return bSub3 - aSub3;
  }

  // 6. Full Name alphabetical tie breaker (A-Z)
  return a.fullName.localeCompare(b.fullName);
}

export function generateCompetitionLists(
  applicants: Applicant[],
  programs: Program[]
): Record<string, Applicant[]> {
  // 1. Determine which program each applicant is admitted to using iterative stable matching
  // Only applicants with consent (hasConsent === true) AND without refusal can occupy budget places
  const activeApplicants = applicants.filter((a) => !a.hasRefusal && a.hasConsent === true);
  const admittedProgramMap = new Map<string, string>(); // fullName -> admitted programId

  let changed = true;
  let maxPasses = programs.length * 3;

  while (changed && maxPasses > 0) {
    changed = false;
    maxPasses--;

    programs.forEach((program) => {
      // Find active applicants who applied to this program
      // and for whom this program is better than or equal to their currently assigned program
      const candidates = activeApplicants
        .filter((a) => a.priorities.includes(program.id))
        .filter((a) => {
          const currentAdmitted = admittedProgramMap.get(a.fullName);
          if (!currentAdmitted || currentAdmitted === program.id) return true;

          // Check if this program has a better (lower number) priority rank than currently admitted program
          const currentRank = a.programScores?.[currentAdmitted]?.priorityRank ?? 999;
          const thisRank = a.programScores?.[program.id]?.priorityRank ?? 999;
          return thisRank < currentRank;
        })
        .map((a) => {
          const ps = a.programScores?.[program.id];
          return {
            applicant: a,
            totalScore: ps?.totalScore ?? a.totalScore,
            subjectsSum: ps?.subjectsSum ?? a.subjectsSum,
            subjects: ps?.subjects ?? a.subjects,
            priorityRank: ps?.priorityRank ?? 999,
          };
        })
        .sort((a, b) => {
          if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
          if (b.subjectsSum !== a.subjectsSum) return b.subjectsSum - a.subjectsSum;
          const bS1 = b.subjects[0]?.score ?? 0;
          const aS1 = a.subjects[0]?.score ?? 0;
          if (bS1 !== aS1) return bS1 - aS1;
          const bS2 = b.subjects[1]?.score ?? 0;
          const aS2 = a.subjects[1]?.score ?? 0;
          if (bS2 !== aS2) return bS2 - aS2;
          const bS3 = b.subjects[2]?.score ?? 0;
          const aS3 = a.subjects[2]?.score ?? 0;
          if (bS3 !== aS3) return bS3 - aS3;
          return a.applicant.fullName.localeCompare(b.applicant.fullName);
        });

      const topCandidates = candidates.slice(0, program.places);
      const topNames = new Set(topCandidates.map((c) => c.applicant.fullName));

      // Remove previous admitted candidates to this program who were displaced
      Array.from(admittedProgramMap.entries()).forEach(([fullName, pid]) => {
        if (pid === program.id && !topNames.has(fullName)) {
          admittedProgramMap.delete(fullName);
          changed = true;
        }
      });

      // Admit top candidates
      topCandidates.forEach((c) => {
        const prevAssigned = admittedProgramMap.get(c.applicant.fullName);
        if (prevAssigned !== program.id) {
          admittedProgramMap.set(c.applicant.fullName, program.id);
          changed = true;
        }
      });
    });
  }

  // 2. Build complete competition list for EACH program (all applicants who applied to that program)
  const competitionLists: Record<string, Applicant[]> = {};

  programs.forEach((program) => {
    const applicantsForProgram = applicants
      .filter((applicant) => applicant.priorities.includes(program.id))
      .map((applicant) => {
        // Use program-specific scores if available (from the file for this program)
        const ps = applicant.programScores?.[program.id];
        const admittedTo = admittedProgramMap.get(applicant.fullName);
        let status: 'admitted' | 'admitted_elsewhere' | 'rejected';
        if (applicant.hasRefusal) {
          // Applicant has filed a formal refusal — always rejected regardless of score
          status = 'rejected';
        } else if (!applicant.hasConsent) {
          // Applicant has not submitted consent — cannot occupy a budget place
          status = 'rejected';
        } else if (admittedTo === program.id) {
          status = 'admitted';
        } else if (admittedTo !== undefined) {
          status = 'admitted_elsewhere';
        } else {
          status = 'rejected';
        }
        return {
          ...applicant,
          ...(ps ? {
            totalScore: ps.totalScore,
            subjectsSum: ps.subjectsSum,
            achievementScore: ps.achievementScore,
            subjects: ps.subjects,
          } : {}),
          status,
          admittedToProgramId: status === 'admitted_elsewhere' ? admittedTo : undefined,
        };
      })
      .sort((a, b) => compareApplicants(a, b));

    competitionLists[program.id] = applicantsForProgram;
  });

  return competitionLists;
}
