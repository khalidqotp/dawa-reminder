import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { addDays } from 'date-fns';
import { loadState, saveState } from './storage';
import {
  setupNotificationChannel,
  requestPermissions,
  rescheduleAll,
  rescheduleMed,
  cancelNotificationsForMed,
} from '../services/notifications';
import { buildDosesForDate, toISO } from '../utils/time';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

// كل كم ساعة نعيد فتح نافذة الجدولة تلقائيًا حتى لا تنتهي التنبيهات صامتة لو فضل التطبيق مفتوح لمدة طويلة
const AUTO_RESCHEDULE_INTERVAL_MS = 6 * 60 * 60 * 1000;

function ensureMissed(meds, settings, history, daysBack) {
  const now = Date.now();
  let changed = false;
  const h = { ...history };
  for (let i = daysBack; i >= 0; i--) {
    const dateISO = toISO(addDays(new Date(), -i));
    const doses = buildDosesForDate(meds, settings, dateISO);
    for (const ds of doses) {
      if (ds.ts < now - 30 * 60 * 1000 && !h[ds.key]) {
        h[ds.key] = { status: 'missed', at: ds.ts };
        changed = true;
      }
    }
  }
  return changed ? h : history;
}

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [meds, setMeds] = useState([]);
  const [settings, setSettings] = useState(null);
  const [history, setHistory] = useState({});
  const [permission, setPermission] = useState(null);
  const medsRef = useRef(meds);
  const settingsRef = useRef(settings);
  medsRef.current = meds;
  settingsRef.current = settings;

  useEffect(() => { bootstrap(); }, []);

  // إعادة جدولة كاملة دورية: عند رجوع التطبيق للواجهة (فتحه بعد إغلاق طويل)
  // وكل بضع ساعات لو فضل مفتوحًا، حتى تمتد نافذة الجدولة القادمة (30 يوم) دائمًا للأمام
  // ولا تنقطع تنبيهات دواء طويل المدى (زي خطة الـ3 شهور) بعد انتهاء النافذة الحالية.
  useEffect(() => {
    if (!ready) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        rescheduleAll(medsRef.current, settingsRef.current, { full: true });
      }
    });
    const id = setInterval(() => {
      rescheduleAll(medsRef.current, settingsRef.current, { full: true });
    }, AUTO_RESCHEDULE_INTERVAL_MS);
    return () => { sub.remove(); clearInterval(id); };
  }, [ready]);

  async function bootstrap() {
    await setupNotificationChannel();
    const p = await requestPermissions();
    setPermission(p);
    let st = await loadState();
    st = { ...st, history: ensureMissed(st.meds, st.settings, st.history, 7) };
    await saveState(st);
    setMeds(st.meds); setSettings(st.settings); setHistory(st.history);
    await rescheduleAll(st.meds, st.settings, { full: true });
    setReady(true);
  }

  async function commit(m, s, h) {
    setMeds(m); setSettings(s); setHistory(h);
    await saveState({ meds: m, settings: s, history: h });
  }

  // تغيير الإعدادات (خصوصًا مواعيد الوجبات) يؤثر على كل الأدوية المرتبطة بالوجبات دفعة واحدة، فنعيد الجدولة الكاملة
  const updateSettings = async (patch) => {
    const s = { ...settings, ...patch };
    await commit(meds, s, history);
    await rescheduleAll(meds, s, { full: true });
  };

  // إضافة/تعديل دواء واحد: نعيد جدولة هذا الدواء فقط (إلغاء انتقائي بـ medId ثم جدولة جديدة)
  // دون لمس تنبيهات باقي الأدوية.
  const saveMed = async (med) => {
    const m = meds.some((x) => x.id === med.id) ? meds.map((x) => (x.id === med.id ? med : x)) : [...meds, med];
    await commit(m, settings, history);
    await rescheduleMed(med, settings);
  };

  // حذف دواء: نلغي تنبيهاته المجدولة تحديدًا بدون المساس بأي دواء آخر
  const deleteMed = async (id) => {
    const m = meds.filter((x) => x.id !== id);
    await commit(m, settings, history);
    await cancelNotificationsForMed(id);
  };

  const markDose = async (key) => {
    const h = { ...history, [key]: { status: 'taken', at: Date.now() } };
    await commit(meds, settings, h);
  };

  const refreshMissed = async () => {
    const h = ensureMissed(meds, settings, history, 0);
    if (h !== history) await commit(meds, settings, h);
  };

  return (
    <Ctx.Provider value={{ ready, meds, settings, history, permission, updateSettings, saveMed, deleteMed, markDose, refreshMissed }}>
      {children}
    </Ctx.Provider>
  );
}
