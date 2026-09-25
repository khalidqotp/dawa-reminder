import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays } from 'date-fns';
import { doseTimesForDate, mealOffsetTime, dateWithTime, toISO, WEEKDAYS_AR } from '../utils/time';

export const CHANNEL_ID = 'medication-alerts-v1';

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
    trigger: { seconds: 3, channelId: CHANNEL_ID },
  });
}

// إعادة جدولة كل التنبيهات بناءً على الأدوية ومواعيد الوجبات الحالية
export async function rescheduleAll(meds, settings) {
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch (e) {}
  for (const med of meds) {
    if (!med || med.enabled === false) continue;
    const base = { title: '💊 وقت الدواء', sound: 'default', data: { medId: med.id } };
    try {
      if (med.scheduleType === 'weekly') {
        const t = (med.times || [])[0] || '10:00';
        const [hour, minute] = t.split(':').map(Number);
        await Notifications.scheduleNotificationAsync({
          content: { ...base, body: `${med.name} — ${med.doseText || ''} (كل ${WEEKDAYS_AR[med.weekday]})` },
          trigger: { channelId: CHANNEL_ID, weekday: med.weekday, hour, minute, repeats: true },
        });
      } else if (med.scheduleType === 'alternate') {
        // لا يمكن تكرار يوم-نعم/يوم-لا كتكرار أسبوعي — نجدول 30 يومًا قادمة بتاريخ محدد
        for (let i = 0; i < 30; i++) {
          const date = addDays(new Date(), i);
          const times = doseTimesForDate(med, settings, toISO(date));
          for (const t of times) {
            const [hour, minute] = t.split(':').map(Number);
            await Notifications.scheduleNotificationAsync({
              content: { ...base, body: `${med.name} — ${med.doseText || ''}` },
              trigger: { channelId: CHANNEL_ID, date: dateWithTime(date, hour, minute) },
            });
          }
        }
      } else {
        const times = med.scheduleType === 'mealLinked'
          ? (med.mealLinks || []).map((l) => mealOffsetTime(settings.meals, l.meal, l.relation))
          : (med.times || []);
        for (const t of times) {
          const [hour, minute] = t.split(':').map(Number);
          await Notifications.scheduleNotificationAsync({
            content: { ...base, body: `${med.name} — ${med.doseText || ''}` },
            trigger: { channelId: CHANNEL_ID, hour, minute, repeats: true },
          });
        }
      }
    } catch (e) {
      // تجاهل خطأ دواء واحد حتى لا يوقف باقي الجدولة
    }
  }
}
