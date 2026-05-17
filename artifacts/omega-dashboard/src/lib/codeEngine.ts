export const PROJECT_CODES = {
  OB: { nameEn: 'Obsidir', nameAr: 'أوبسيدير' },
  LL: { nameEn: 'Lumia Lagoon', nameAr: 'لوميا لاجون' },
  LR: { nameEn: 'Lumia Residence', nameAr: 'لوميا ريزيدنس' },
  MVA: { nameEn: 'Movenpick Aswan', nameAr: 'موفنبيك أسوان' }
} as const;

export type ProjectCode = keyof typeof PROJECT_CODES;

export const JOB_ROLE_CODES = {
  'PM-MGR': { en: 'Project Manager', ar: 'مدير مشروع' },
  'CM-MGR': { en: 'Construction Manager', ar: 'مدير إنشاءات' },
  'EXEC-MGR': { en: 'Execution / Site Manager', ar: 'مدير تنفيذ / مدير موقع' },
  'EXEC-ENG': { en: 'Execution Engineer', ar: 'مهندس تنفيذ' },
  'CIVIL-ENG': { en: 'Civil Engineer', ar: 'مهندس مدني' },
  'TECH-MGR': { en: 'Technical Office Manager', ar: 'مدير مكتب فني' },
  'TECH-ENG': { en: 'Technical Office Engineer', ar: 'مهندس مكتب فني' },
  'QS-ENG': { en: 'QS Engineer', ar: 'مهندس حصر / كميات' },
  'PLAN-ENG': { en: 'Planning Engineer', ar: 'مهندس تخطيط' },
  'HSE-MGR': { en: 'HSE Manager', ar: 'مدير سلامة وصحة مهنية' },
  'HSE-SUP': { en: 'HSE Supervisor', ar: 'مشرف سلامة وصحة مهنية' },
  'ARCH-ENG': { en: 'Architect Engineer', ar: 'مهندس معماري' },
  'MEP-ENG': { en: 'MEP Engineer', ar: 'مهندس ميكانيكا/كهرباء/MEP' },
  'ADMIN': { en: 'Site / Project Admin', ar: 'إداري موقع / إداري مشروع' },
  'ACC': { en: 'Site / Project Accountant', ar: 'محاسب موقع / محاسب مشروع' },
  'STORE': { en: 'Storekeeper', ar: 'أمين مخزن' },
  'SURVEY': { en: 'Surveyor', ar: 'مساح' },
  'FOREMAN': { en: 'Foreman', ar: 'فورمان / مشرف عمال' },
  'DRIVER': { en: 'Driver', ar: 'سائق' },
  'WATCHMAN': { en: 'Security / Watchman', ar: 'أمن / حراسة' }
} as const;

export type JobRoleCode = keyof typeof JOB_ROLE_CODES;

/**
 * Normalizes any project title or abbreviation into the standard 2-3 letter uppercase code.
 */
export function normalizeProjectCode(input: string | null | undefined): ProjectCode | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();

  if (clean === 'ob' || clean.includes('obsidir') || clean.includes('أوبسيدير')) return 'OB';
  if (clean === 'll' || clean.includes('lagoon') || clean.includes('لاجون')) return 'LL';
  if (clean === 'lr' || clean.includes('residence') || clean.includes('ريزيدنس')) return 'LR';
  if (clean === 'mva' || clean.includes('movenpick') || clean.includes('موفنبيك') || clean.includes('aswan') || clean.includes('أسوان')) return 'MVA';

  return null;
}

/**
 * Normalizes any job title or code string (Arabic or English) into the standard uppercase Job Role Code.
 */
export function normalizeJobRoleCode(input: string | null | undefined): JobRoleCode | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();
  const upper = input.trim().toUpperCase();

  // Direct match against codes
  if (upper in JOB_ROLE_CODES) return upper as JobRoleCode;

  // Strict mapping checks
  if (clean.includes('project manager') || clean.includes('مدير مشروع')) return 'PM-MGR';
  if (clean.includes('construction manager') || clean.includes('مدير إنشاءات') || clean.includes('مدير انشاءات')) return 'CM-MGR';
  if (clean.includes('site manager') || clean.includes('execution manager') || clean.includes('مدير تنفيذ') || clean.includes('مدير موقع')) return 'EXEC-MGR';
  if (clean.includes('execution engineer') || clean.includes('مهندس تنفيذ')) return 'EXEC-ENG';
  if (clean.includes('civil engineer') || clean.includes('مهندس مدني') || clean.includes('مهندس مدنى')) return 'CIVIL-ENG';
  if (clean.includes('technical office manager') || clean.includes('مدير مكتب فني') || clean.includes('مدير مكتب فنى')) return 'TECH-MGR';
  if (clean.includes('technical office engineer') || clean.includes('مهندس مكتب فني') || clean.includes('مهندس مكتب فنى')) return 'TECH-ENG';
  if (clean.includes('qs engineer') || clean.includes('مهندس حصر') || clean.includes('كميات')) return 'QS-ENG';
  if (clean.includes('planning engineer') || clean.includes('مهندس تخطيط')) return 'PLAN-ENG';
  if (clean.includes('hse manager') || clean.includes('مدير سلامة') || clean.includes('مدير سلامه')) return 'HSE-MGR';
  if (clean.includes('hse supervisor') || clean.includes('مشرف سلامة') || clean.includes('مشرف سلامه')) return 'HSE-SUP';
  if (clean.includes('architect') || clean.includes('مهندس معماري') || clean.includes('مهندس معمارى')) return 'ARCH-ENG';
  if (clean.includes('mep') || clean.includes('ميكانيكا') || clean.includes('كهرباء')) return 'MEP-ENG';
  if (clean.includes('admin') || clean.includes('إداري') || clean.includes('اداري')) return 'ADMIN';
  if (clean.includes('accountant') || clean.includes('محاسب')) return 'ACC';
  if (clean.includes('store') || clean.includes('أمين مخزن') || clean.includes('امين مخزن')) return 'STORE';
  if (clean.includes('surveyor') || clean.includes('مساح')) return 'SURVEY';
  if (clean.includes('foreman') || clean.includes('فورمان') || clean.includes('مشرف عمال')) return 'FOREMAN';
  if (clean.includes('driver') || clean.includes('سائق')) return 'DRIVER';
  if (clean.includes('watchman') || clean.includes('security') || clean.includes('أمن') || clean.includes('امن') || clean.includes('حراسة') || clean.includes('حراسه')) return 'WATCHMAN';

  return null;
}

/**
 * Builds the structural code prefix string.
 */
export function buildStaffCodePrefix(projectCode: ProjectCode, jobCode: JobRoleCode): string {
  return `${projectCode}-${jobCode}`;
}
