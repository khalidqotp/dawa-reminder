import { differenceInCalendarDays, format, isSunday, parseISO } from 'date-fns';

export const toISO = (d) => format(d, 'yyyy-MM-dd');
export const todayISO = () => toISO(new Date());

export const WEEKDAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const MEALS_AR = { breakfast: 'الفطار', lunch: 'الغداء', dinner: 'العشاء' };
export const MEAL_KEYS = ['breakfast', 'lunch', 'dinner'];
export const RELATIONS_AR = { before: 'قبل الأكل', after: 'بعد الأكل', none: 'وقت محدد' };
export const FORMS_AR = ['قرص', 'أقراص', 'كبسولة', 'مرهم', 'حقنة', 'أخرى'];
export const FORM_ICONS = { 'قرص': '💊', 'أقراص': '💊', 'كبسولة': '💊', 'مرهم': '🧴', 'حقنة': '💉', 'أخرى': '💊' };

export function timeToMinutes(hhmm) {
  const [h, m] = String(hhmm || '0:0').split(':').map(Number);
  return h * 60 + m;
}

export function minutesToHHMM(total) {
  const t = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

// موعد الجرعة المرتبطة بوجبة = موعد الوجبة ± 30 دقيقة
export function mealOffsetTime(meals, mealKey, relation, offsetMin = 30) {
  const base = timeToMinutes((meals && meals[mealKey]) || '08:00');
  const delta = relation === 'before' ? -offsetMin : relation === 'after' ? offsetMin : 0;
  return minutesToHHMM(base + delta);
}

export function timeOnDate(dateISO, hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  const d = parseISO(dateISO);
  d.setHours(h, m, 0, 0);
  return d;
}

export function dateWithTime(date, hour, minute) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function isActiveOnDate(med, dateISO) {
  if (med.enabled === false) return false;
  if (med.startDate && dateISO < med.startDate) return false;
  if (med.endDate && dateISO > med.endDate) return false;
  return true;
}

// أوقات جرعات دواء معين في يوم معين (dateISO بصيغة yyyy-MM-dd)
export function doseTimesForDate(med, settings, dateISO) {
  if (!isActiveOnDate(med, dateISO)) return [];
  if (med.scheduleType === 'mealLinked') {
    return (med.mealLinks || []).map((l) => mealOffsetTime(settings.meals, l.meal, l.relation));
  }
  if (med.scheduleType === 'alternate') {
    const idx = differenceInCalendarDays(parseISO(dateISO), parseISO(med.startDate));
    if (idx < 0) return [];
    if (idx % 2 !== 0) return []; // يوم "لا"
    // الأحد دائمًا "لا" ولا يزحلق الجدول ولا يُحتسب من التبديل
    if (med.alwaysOffSunday !== false && isSunday(parseISO(dateISO))) return [];
    return med.times || [];
  }
  if (med.scheduleType === 'weekly') {
    if (parseISO(dateISO).getDay() !== med.weekday) return [];
    return med.times || [];
  }
  return med.times || []; // daily
}

function makeDose(med, dateISO, time, label) {
  return {
    key: `${med.id}|${dateISO}|${time}`,
    medId: med.id,
    name: med.name,
    doseText: med.doseText || '',
    form: med.form || 'أخرى',
    time,
    label: label || '',
    ts: timeOnDate(dateISO, time).getTime(),
    dateISO,
  };
}

export function buildDosesForDate(meds, settings, dateISO) {
  const list = [];
  for (const med of meds) {
    if (!isActiveOnDate(med, dateISO)) continue;
    if (med.scheduleType === 'mealLinked') {
      for (const l of med.mealLinks || []) {
        list.push(makeDose(med, dateISO, mealOffsetTime(settings.meals, l.meal, l.relation), `${RELATIONS_AR[l.relation]} ${MEALS_AR[l.meal]}`));
      }
    } else {
      for (const t of doseTimesForDate(med, settings, dateISO)) {
        list.push(makeDose(med, dateISO, t, ''));
      }
    }
  }
  return list.sort((a, b) => a.ts - b.ts);
}

export function describeSchedule(med, settings) {
  if (med.scheduleType === 'daily') return `يوميًا — ${(med.times || []).join('، ')}`;
  if (med.scheduleType === 'mealLinked') return (med.mealLinks || []).map((l) => `${RELATIONS_AR[l.relation]} ${MEALS_AR[l.meal]}`).join('، ');
  if (med.scheduleType === 'alternate') return `يوم نعم / يوم لا — ${(med.times || [])[0] || ''} (الأحد دائمًا بدون)`;
  if (med.scheduleType === 'weekly') return `كل ${WEEKDAYS_AR[med.weekday]} — ${(med.times || [])[0] || ''}`;
  return '';
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
