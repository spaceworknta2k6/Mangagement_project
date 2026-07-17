export const SEMESTER_OPTIONS = [
  { value: '1', label: 'Học kỳ 1' },
  { value: '2', label: 'Học kỳ 2' },
  { value: '3', label: 'Học kỳ 3' },
];

export function normalizeSemester(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === '3' || raw === 'iii' || raw.includes('3') || raw.includes('iii')) return '3';
  if (raw === '2' || raw === 'ii' || raw.includes('2') || raw.includes('ii')) return '2';
  if (raw === '1' || raw === 'i' || raw.includes('1') || raw.includes('i')) return '1';
  return String(value || '').trim();
}

export function normalizeCohort(value) {
  return String(value || '').trim().toUpperCase();
}

export function getUserCohort(user) {
  return normalizeCohort(user?.cohort || user?.student?.cohort || user?.studentId?.cohort);
}

function getFallbackAcademicTerm(now = new Date()) {
  const date = new Date(now);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month >= 8) {
    return { schoolYear: `${year}-${year + 1}`, semester: '1', source: 'fallback' };
  }

  if (month >= 6) {
    return { schoolYear: `${year - 1}-${year}`, semester: '3', source: 'fallback' };
  }

  return { schoolYear: `${year - 1}-${year}`, semester: '2', source: 'fallback' };
}

export function getPeriodCohort(period) {
  return normalizeCohort(period?.cohort || period?.batchId?.cohort);
}

function getPeriodStart(period) {
  return period?.registrationStart || period?.projectStart || period?.createdAt || null;
}

function getPeriodEnd(period) {
  return period?.archiveDeadline
    || period?.revisionDeadline
    || period?.gradingEnd
    || period?.projectEnd
    || period?.registrationEnd
    || period?.updatedAt
    || null;
}

function toTime(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function byNearestPeriod(nowTime) {
  return (left, right) => {
    const leftStart = toTime(getPeriodStart(left)) ?? 0;
    const rightStart = toTime(getPeriodStart(right)) ?? 0;
    const leftDistance = Math.abs(leftStart - nowTime);
    const rightDistance = Math.abs(rightStart - nowTime);
    if (leftDistance !== rightDistance) return leftDistance - rightDistance;
    return rightStart - leftStart;
  };
}

export function findCurrentPeriodForCohort(periods = [], cohort = '', now = new Date()) {
  const normalizedCohort = normalizeCohort(cohort);
  const nowTime = new Date(now).getTime();
  const candidates = periods.filter((period) => {
    if (!period?.schoolYear || !period?.semester) return false;
    if (!normalizedCohort) return true;
    return getPeriodCohort(period) === normalizedCohort;
  });

  const activePeriod = candidates
    .filter((period) => {
      const startTime = toTime(getPeriodStart(period));
      const endTime = toTime(getPeriodEnd(period));
      if (startTime === null && endTime === null) return false;
      return (startTime === null || startTime <= nowTime) && (endTime === null || nowTime <= endTime);
    })
    .sort(byNearestPeriod(nowTime))[0];

  if (activePeriod) return activePeriod;

  return [...candidates].sort(byNearestPeriod(nowTime))[0] || null;
}

export function getCurrentAcademicTerm(options = {}) {
  const { user, periods = [], cohort, now = new Date() } = options;
  const normalizedCohort = normalizeCohort(cohort || getUserCohort(user));
  const matchedPeriod = findCurrentPeriodForCohort(periods, normalizedCohort, now);

  if (matchedPeriod) {
    return {
      schoolYear: matchedPeriod.schoolYear,
      semester: normalizeSemester(matchedPeriod.semester),
      cohort: getPeriodCohort(matchedPeriod) || normalizedCohort,
      periodId: matchedPeriod._id || matchedPeriod.id,
      source: 'period',
    };
  }

  return {
    ...getFallbackAcademicTerm(now),
    cohort: normalizedCohort,
  };
}

export const CURRENT_ACADEMIC_TERM = getCurrentAcademicTerm();

export function getAcademicYearOptions(periods = []) {
  const currentYear = new Date().getFullYear();
  const years = new Set([CURRENT_ACADEMIC_TERM.schoolYear]);
  for (let index = 0; index < 6; index += 1) {
    const start = currentYear - index;
    years.add(`${start}-${start + 1}`);
  }
  periods.forEach((period) => {
    if (period?.schoolYear) years.add(period.schoolYear);
  });
  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

export function isPeriodInTerm(period, schoolYear, semester) {
  if (!period) return false;
  return period.schoolYear === schoolYear && normalizeSemester(period.semester) === normalizeSemester(semester);
}

export function getRecordPeriod(record, periods = []) {
  const period = record?.periodId;
  if (period && typeof period === 'object') return period;
  const periodId = period?._id || period;
  return periods.find((item) => String(item._id) === String(periodId)) || null;
}

export function filterRecordsByTerm(records = [], periods = [], schoolYear, semester) {
  return records.filter((record) => isPeriodInTerm(getRecordPeriod(record, periods), schoolYear, semester));
}
