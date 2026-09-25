import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays } from 'date-fns';
import { doseTimesForDate, dateWithTime, toISO, WEEKDAYS_AR } from '../utils/time';

export const CHANNEL_ID = 'medication-alerts-v1';

// عدد الأيام المقبلة التي تُجدول فعليًا بتواريخ محددة (بدل تكرار دائم)
// تُعاد جدولتها دوريًا (عند فتح التطبيق / رجوعه للواجهة) حتى لا يخرج أي تنبيه قبل
// startDate أو بعد endDate لأي دواء، ولا تتوقف التنبيهات بعد انتهاء هذه النافذة.
export const SCHEDULE_WINDOW_DAYS = 30;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// قناة الإشعارات: أهمية قصوى + صوت الافتراضي مخصص لمجرى أصوات الإشعارات + اهتزاز
export async function setupNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'تنبيهات الأدوية',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    audioAttributes: {
      usage: Notifications.AndroidAudioContentType.SONIFICATION,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
    vibrationPattern: [0, 500, 500, 500],
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    lightColor: '#2E7D6B',
  });
}

export async function requestPermissions() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return existing;
    const { status } = await Notifications.requestPermissionsAsync();
    return status;
  } catch (e) {
    return 'undetermined';
  }
}

export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: { title: '💊 دوائي', body: 'إذا سمعت الصوت ورأيت التنبيه فالتنبيهات تعمل بشكل سليم ✅', sound: 'default' },
    trigger: { seconds: 3, channelId: CHANNEL_ID, allowWhileIdle: true },
  });
}

// إلغاء كل التنبيهات المجدولة الخاصة بدواء واحد فقط (بالاعتماد على data.medId المخزّن مع كل تنبيه)
// بدل إلغاء كل شيء وإعادة جدولة الكل، تفاديًا لفقد تنبيهات أدوية أخرى لو حصل خطأ في المنتصف.
export async function cancelNotificationsForMed(medId) {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const mine = all.filter((n) => n.content && n.content.data && n.content.data.medId === medId);
    for (const n of mine) {
      try { await Notifications.cancelScheduledNotificationAsync(n.identifier); } catch (e) {}
    }
  } catch (e) {}
}

// جدولة تنبيهات دواء واحد بتواريخ محددة ضمن نافذة SCHEDULE_WINDOW_DAYS القادمة فقط،
// باستخدام doseTimesForDate الموحّدة (تحترم isActiveOnDate لكل أنواع الجدولة: daily, mealLinked, alternate, weekly)
// فلا يخرج أي تنبيه قبل startDate ولا بعد endDate لأي دواء.
async function scheduleForMed(med, settings) {
  if (!med || med.enabled === false) return;
  const base = { title: '💊 وقت الدواء', sound: 'default', data: { medId: med.id } };
  const now = Date.now();
  for (let i = 0; i < SCHEDULE_WINDOW_DAYS; i++) {
    const date = addDays(new Date(), i);
    const dateISO = toISO(date);
    const times = doseTimesForDate(med, settings, dateISO);
    for (const t of times) {
      const [hour, minute] = t.split(':').map(Number);
      const fireDate = dateWithTime(date, hour, minute);
      if (fireDate.getTime() <= now) continue; // لا نجدول وقتًا فات بالفعل
      const label = med.scheduleType === 'weekly' ? ` — ${WEEKDAYS_AR[med.weekday]}` : '';
      try {
        await Notifications.scheduleNotificationAsync({
          content: { ...base, body: `${med.name} — ${med.doseText || ''}${label}` },
          trigger: { channelId: CHANNEL_ID, date: fireDate, allowWhileIdle: true },
        });
      } catch (e) {}
    }
  }
}

// إعادة جدولة دواء واحد فقط: إلغاء انتقائي لتنبيهاته القديمة ثم جدولة جديدة — تُستخدم بعد إضافة/تعديل/حذف دواء واحد
export async function rescheduleMed(med, settings) {
  await cancelNotificationsForMed(med.id);
  await scheduleForMed(med, settings);
}

// إعادة جدولة كل الأدوية.
// full=true: تُستخدم عند فتح التطبيق، أو تغيير مواعيد الوجبات (تؤثر على كل الأدوية المرتبطة بالوجبات)،
//            أو زر "إعادة جدولة كل التنبيهات" — تُلغي كل شيء ثم تعيد الجدولة (تحمي من تراكم تنبيهات قديمة).
// full=false (افتراضي): إعادة جدولة انتقائية لكل دواء على حدة بدون لمس تنبيهات باقي الأدوية.
export async function rescheduleAll(meds, settings, { full = false } = {}) {
  if (full) {
    try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch (e) {}
    for (const med of meds) {
      if (!med || med.enabled === false) continue;
      await scheduleForMed(med, settings);
    }
  } else {
    for (const med of meds) {
      await rescheduleMed(med, settings);
    }
  }
}
