import { addDays, addMonths, format } from 'date-fns';

// الخطة الابتدائية — تُحفظ مرة واحدة عند أول تشغيل وكلها قابلة للتعديل بعدها
export function createInitialData() {
  const now = new Date();
  const d = (n) => format(addDays(now, n), 'yyyy-MM-dd');
  const end3m = format(addMonths(now, 3), 'yyyy-MM-dd');

  const settings = {
    meals: { breakfast: '14:00', lunch: '19:00', dinner: '00:00' }, // فطار 2 ظهرًا، غداء 7 مساءً، عشاء 12 منتصف الليل
    showPhotos: true,
    labDate: format(addDays(new Date(end3m + 'T12:00:00'), 7), 'yyyy-MM-dd'), // موعد التحاليل بعد نهاية الخطة بأسبوع (قابل للتعديل)
  };

  const meds = [
    // خطة أسبوعين (بدأت من 4 أيام)
    { id: 'm_frost', name: 'Frost Massage Gel', form: 'مرهم', doseText: 'دهان خارجي', scheduleType: 'daily', times: ['09:00', '15:00', '21:00'], startDate: d(-4), endDate: d(10), enabled: true },
    { id: 'm_alphintern', name: 'Alphintern', form: 'أقراص', doseText: '3 أقراص قبل الأكل', scheduleType: 'mealLinked', mealLinks: [{ meal: 'breakfast', relation: 'before' }, { meal: 'lunch', relation: 'before' }, { meal: 'dinner', relation: 'before' }], startDate: d(-4), endDate: d(10), enabled: true },
    { id: 'm_futacoxib', name: 'Futacoxib 90mg (Etoricoxib)', form: 'قرص', doseText: 'قرص واحد بعد الغداء', scheduleType: 'mealLinked', mealLinks: [{ meal: 'lunch', relation: 'after' }], startDate: d(-4), endDate: d(10), enabled: true },

    // خطة 3 شهور (تبدأ اليوم)
    { id: 'm_apetoid', name: 'Apetoid (Leflunomide 20mg)', form: 'قرص', doseText: 'قرص واحد بعد الغداء', scheduleType: 'mealLinked', mealLinks: [{ meal: 'lunch', relation: 'after' }], startDate: d(0), endDate: end3m, enabled: true },
    { id: 'm_folic', name: 'Folic Acid 5mg', form: 'قرص', doseText: 'قرص واحد بعد العشاء', scheduleType: 'alternate', times: ['00:30'], alwaysOffSunday: true, startDate: d(0), endDate: end3m, enabled: true },
    { id: 'm_unitrexate', name: 'Unitrexate (حقنة)', form: 'حقنة', doseText: 'نص أمبولة', scheduleType: 'weekly', weekday: 0, times: ['10:00'], startDate: d(0), endDate: end3m, enabled: true },
  ];

  return { meds, settings, history: {} };
}
