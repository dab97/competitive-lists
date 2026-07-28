import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Applicant, Program } from '@/types';
import { generateCompetitionLists } from '@/lib/admissions';
import { programs as defaultPrograms } from '@/data/programs';

interface AdmissionsState {
  applicants: Applicant[];
  programs: Program[];
  competitionLists: Record<string, Applicant[]>;
  setApplicants: (applicants: Applicant[]) => void;
  updateProgramPlaces: (programId: string, places: number) => void;
  resetProgramPlaces: () => void;
  clearApplicants: () => void;
}

export const useAdmissionsStore = create<AdmissionsState>()(
  persist(
    (set, get) => ({
      applicants: [],
      programs: defaultPrograms,
      competitionLists: {},
      setApplicants: (applicants) => {
        const currentPrograms = get().programs;
        const lists = generateCompetitionLists(applicants, currentPrograms);
        set({ applicants, competitionLists: lists });
      },
      updateProgramPlaces: (programId, places) => {
        const updatedPrograms = get().programs.map((p) =>
          p.id === programId ? { ...p, places: Math.max(1, places) } : p
        );
        const currentApplicants = get().applicants;
        const lists = currentApplicants.length > 0 
          ? generateCompetitionLists(currentApplicants, updatedPrograms)
          : {};
        set({ programs: updatedPrograms, competitionLists: lists });
      },
      resetProgramPlaces: () => {
        const currentApplicants = get().applicants;
        const lists = currentApplicants.length > 0 
          ? generateCompetitionLists(currentApplicants, defaultPrograms)
          : {};
        set({ programs: defaultPrograms, competitionLists: lists });
      },
      clearApplicants: () => {
        set({ applicants: [], competitionLists: {} });
      },
    }),
    {
      name: 'admissions-storage',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          // Migrate: add empty programScores to old cached applicants
          if (Array.isArray(persistedState?.applicants)) {
            persistedState.applicants = persistedState.applicants.map((a: any) => ({
              ...a,
              programScores: a.programScores ?? {},
            }));
          }
        }
        return persistedState;
      },
    }
  )
);