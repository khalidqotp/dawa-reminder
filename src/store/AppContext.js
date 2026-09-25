import React, { createContext, useContext, useEffect, useState } from 'react';
import { addDays } from 'date-fns';
import { loadState, saveState } from './storage';
import { setupNotificationChannel, requestPermissions, rescheduleAll } from '../services/notifications';
import { buildDosesForDate, toISO } from '../utils/time';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

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

  useEffect(() => { bootstrap(); }, []);

  async function bootstrap() {
    await setupNotificationChannel();
    const p = await requestPermissions();
    setPermission(p);
    let st = await loadState();
    st = { ...st, history: ensureMissed(st.meds, st.settings, st.history, 7) };
    await saveState(st);
    setMeds(st.meds); setSettings(st.settings); setHistory(st.history);
    await rescheduleAll(st.meds, st.settings);
    setReady(true);
  }

  async function commit(m, s, h) {
    setMeds(m); setSettings(s); setHistory(h);
    await saveState({ meds: m, settings: s, history: h });
  }

  const updateSettings = async (patch) => {
    const s = { ...settings, ...patch };
    await commit(meds, s, history);
    await rescheduleAll(meds, s);
  };

  const saveMed = async (med) => {
    const m = meds.some((x) => x.id === med.id) ? meds.map((x) => (x.id === med.id ? med : x)) : [...meds, med];
    await commit(m, settings, history);
    await rescheduleAll(m, settings);
  };

  const deleteMed = async (id) => {
    const m = meds.filter((x) => x.id !== id);
    await commit(m, settings, history);
    await rescheduleAll(m, settings);
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
