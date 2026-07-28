import * as XLSX from 'xlsx';
import { Applicant, SubjectScore } from '@/types';
import { programs } from '@/data/programs';

function parseNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  const cleaned = String(val).replace(',', '.').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseBool(val: any): boolean {
  if (!val) return false;
  const clean = String(val).trim().toLowerCase();
  return clean === '✓' || clean === '+' || clean === 'да' || clean === '1' || clean === 'true' || clean === 'сдано';
}

/** Parses a single consent column that can be: empty | checkmark/да | 'отказ' */
function parseConsent(val: any): { hasConsent: boolean; hasRefusal: boolean } {
  if (!val) return { hasConsent: false, hasRefusal: false };
  const clean = String(val).trim().toLowerCase();
  if (clean === 'отказ' || clean === 'отказано' || clean === 'отказался' || clean === 'отказалась') {
    return { hasConsent: false, hasRefusal: true };
  }
  const consent = clean === '✓' || clean === '+' || clean === 'да' || clean === '1' || clean === 'true' || clean === 'сдано';
  return { hasConsent: consent, hasRefusal: false };
}

function getProgramIdFromFileNameOrString(str: string): string | null {
  const lowerStr = str.toLowerCase();

  // Sort programs so that those with longer/more specific form names (e.g. 'Очно-Заочная' before 'Очная') are matched first
  const sortedPrograms = [...programs].sort((a, b) => b.form.length - a.form.length);

  for (const prog of sortedPrograms) {
    const nameMatch = lowerStr.includes(prog.name.toLowerCase());
    const formMatch = lowerStr.includes(prog.form.toLowerCase());
    if (nameMatch && formMatch) {
      return prog.id;
    }
  }

  // Fallback: match by keywords
  for (const prog of sortedPrograms) {
    if (prog.keywords.every((keyword) => lowerStr.includes(keyword.toLowerCase()))) {
      return prog.id;
    }
  }

  return null;
}

export function parseExcelOrCSV(data: ArrayBuffer | string, fileName: string): Applicant[] {
  let rows: any[][] = [];

  if (typeof data === 'string' && !fileName.toLowerCase().endsWith('.xls') && !fileName.toLowerCase().endsWith('.xlsx')) {
    // Parse text CSV
    const cleanData = data.replace(/^\uFEFF/, '');
    const lines = cleanData.split(/\r?\n/).filter((line) => line.trim().length > 0);
    rows = lines.map((line) => {
      const delimiter = line.includes(';') ? ';' : '\t';
      return line.split(delimiter).map((col) => col.trim());
    });
  } else {
    // Parse XLS / XLSX / Binary CSV using SheetJS
    const workbook = XLSX.read(data, { type: typeof data === 'string' ? 'string' : 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
  }

  if (!rows || rows.length === 0) {
    throw new Error('Файл пуст или не содержит данных');
  }

  // Find header row containing 'ФИО'
  const headerIdx = rows.findIndex(
    (r) => Array.isArray(r) && r.some((c) => String(c).includes('ФИО'))
  );

  const dataRows = headerIdx !== -1
    ? rows.slice(headerIdx + 1).filter((r) => Array.isArray(r) && r.length > 1 && r[1])
    : rows.filter((r) => Array.isArray(r) && r.length >= 4);

  const programId = getProgramIdFromFileNameOrString(fileName);
  if (!programId) {
    throw new Error(`Не удалось определить направление подготовки по имени файла "${fileName}". Убедитесь, что в названии файла присутствует название направления (например, «Юриспруденция», «Менеджмент», «Психология»).`);
  }
  const applicantMap = new Map<string, Applicant>();

  /** Returns true if the row looks like a 1C / modern admissions export row (not legacy 4-col) */
  function looksLikeModernFormat(cols: any[]): boolean {
    if (cols.length < 13) return false;
    // col[0] should be a row number (numeric)
    const col0 = String(cols[0] ?? '').trim();
    if (col0 !== '' && isNaN(parseFloat(col0.replace(',', '.')))) return false;
    // col[1] should be a non-empty name string, not a number
    const col1 = String(cols[1] ?? '').trim();
    if (!col1 || col1.length < 3) return false;
    if (!isNaN(parseFloat(col1))) return false; // pure number → not a name
    // col[3] should be numeric (total score)
    const col3 = String(cols[3] ?? '').trim();
    if (col3 !== '' && isNaN(parseFloat(col3.replace(',', '.')))) return false;
    // col[4] should be numeric (subjects sum)
    const col4 = String(cols[4] ?? '').trim();
    if (col4 !== '' && isNaN(parseFloat(col4.replace(',', '.')))) return false;
    return true;
  }

  dataRows.forEach((cols) => {
    let fullName = '';
    let phone = '';
    let email = '';
    let hasPreference = false;
    let totalScore = 0;
    let subjectsSum = 0;
    let achievementScore = 0;
    let hasConsent = false;
    let hasRefusal = false;
    let subjects: SubjectScore[] = [];
    let p3Score = 0;
    let priorityRank = 999; // default: unknown priority

    if (headerIdx !== -1 || looksLikeModernFormat(cols)) {
      // 1C / Standard Admissions layout
      fullName = String(cols[1] || '').trim();
      if (!fullName || fullName === 'ФИО') return;

      hasPreference = parseBool(cols[2]);
      totalScore = parseNumber(cols[3]);
      subjectsSum = parseNumber(cols[4]);

      const p1Name = String(cols[5] || '').trim() || 'Предмет 1';
      const p1Score = parseNumber(cols[6]);
      const p2Name = String(cols[7] || '').trim() || 'Предмет 2';
      const p2Score = parseNumber(cols[8]);
      const p3Name = String(cols[9] || '').trim() || 'Русский язык';
      p3Score = parseNumber(cols[10]);

      subjects = [
        { name: p1Name, score: p1Score },
        { name: p2Name, score: p2Score },
        { name: p3Name, score: p3Score },
      ];

      achievementScore = parseNumber(cols[11]);
      // Always recalculate subjectsSum from individual scores to guarantee consistency
      subjectsSum = p1Score + p2Score + p3Score;
      // Recalculate totalScore if it's missing, or if it doesn't match subjectsSum+achievements
      const expectedTotal = subjectsSum + achievementScore;
      if (totalScore === 0 || Math.abs(totalScore - expectedTotal) > 0.01) {
        totalScore = expectedTotal;
      }

      const consent = parseConsent(cols[12]);
      hasConsent = consent.hasConsent;
      hasRefusal = consent.hasRefusal;
      // col[13] = applicant's self-declared priority for this program (1 = highest)
      priorityRank = parseNumber(cols[13]) || 999;
      // col[14]/col[15] optional extra info like phone / email / ID
      const extraContact = String(cols[14] || cols[15] || '').trim();
      if (extraContact) {
        if (extraContact.includes('@')) {
          email = extraContact;
        } else if (/[\d+\-() ]{7,}/.test(extraContact)) {
          phone = extraContact;
        }
      }
    } else {
      // Legacy 4-column CSV
      fullName = String(cols[0] || '').trim();
      if (!fullName || fullName === 'ФИО') return;

      p3Score = parseNumber(cols[1]);
      subjectsSum = p3Score;
      totalScore = p3Score;
      subjects = [{ name: 'Русский язык', score: p3Score }];
    }

    const applicantId = phone || email ? `${fullName}_${phone || email}` : fullName.toLowerCase().replace(/\s+/g, '_');
    const existing = applicantMap.get(fullName) || applicantMap.get(applicantId);
    const thisProgramScore = { totalScore, subjectsSum, achievementScore, subjects, priorityRank };

    if (existing) {
      if (!existing.priorities.includes(programId)) {
        existing.priorities.push(programId);
      }
      if (hasConsent) existing.hasConsent = true;
      if (hasRefusal) existing.hasRefusal = true;
      if (hasPreference) existing.hasPreference = true;
      if (phone) existing.phone = phone;
      if (email) existing.email = email;
      // Save per-program scores (always, even if duplicate row in same file)
      const existingProgramScore = existing.programScores[programId];
      if (!existingProgramScore || subjectsSum > existingProgramScore.subjectsSum) {
        existing.programScores[programId] = thisProgramScore;
      }
      // Global fallback scores: keep highest
      if (subjectsSum > existing.subjectsSum) {
        existing.subjects = subjects;
        existing.russianScore = p3Score;
        existing.subjectsSum = subjectsSum;
      }
      existing.achievementScore = Math.max(existing.achievementScore, achievementScore);
      existing.totalScore = existing.subjectsSum + existing.achievementScore;
    } else {
      applicantMap.set(fullName, {
        id: applicantId,
        fullName,
        phone,
        email,
        subjects,
        subjectsSum,
        achievementScore,
        totalScore,
        hasConsent,
        hasRefusal,
        hasPreference,
        russianScore: p3Score,
        priorities: [programId],
        program: fileName,
        status: 'pending',
        programScores: { [programId]: thisProgramScore },
      });
    }
  });

  return Array.from(applicantMap.values());
}

export function parseCSV(csvData: string, defaultProgramStr?: string): Applicant[] {
  return parseExcelOrCSV(csvData, defaultProgramStr || 'file.csv');
}

export function exportToCSV(applicants: Applicant[], filename: string): void {
  const BOM = '\uFEFF';
  const header = '№;ФИО;Преимущ. право;Сумма баллов;Сумма баллов по предметам;Предмет 1;Балл 1;Предмет 2;Балл 2;Предмет 3;Балл 3;Сумма за инд.дост.;Согласие на зачисление;Статус;Направление\n';
  
  const content = applicants
    .map((applicant, index) => {
      const status = applicant.status === 'admitted'
        ? 'Зачислен'
        : applicant.status === 'admitted_elsewhere'
        ? 'На другом направлении'
        : 'Не зачислен';
      const pref = applicant.hasPreference ? '✓' : '';
      const consent = applicant.hasConsent ? '✓' : '';
      
      const s1 = applicant.subjects[0] || { name: '', score: '' };
      const s2 = applicant.subjects[1] || { name: '', score: '' };
      const s3 = applicant.subjects[2] || { name: '', score: '' };

      return `${index + 1};${applicant.fullName};${pref};${applicant.totalScore};${applicant.subjectsSum};${s1.name};${s1.score};${s2.name};${s2.score};${s3.name};${s3.score};${applicant.achievementScore};${consent};${status};${applicant.program}`;
    })
    .join('\n');
  
  const csvContent = BOM + header + content;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(link.href);
}
