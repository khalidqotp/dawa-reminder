import AsyncStorage from '@react-native-async-storage/async-storage';
import { createInitialData } from '../data/initialPlan';

const K = { meds: 'dawa.meds.v1', settings: 'dawa.settings.v1', history: 'dawa.history.v1' };

export async function loadState() {
  try {
    const [m, s, h] = await Promise.all([
      AsyncStorage.getItem(K.meds),
      AsyncStorage.getItem(K.settings),
      AsyncStorage.getItem(K.history),
    ]);
    if (m && s) {
      return { meds: JSON.parse(m), settings: JSON.parse(s), history: h ? JSON.parse(h) : {} };
    }
  } catch (e) {
    // أول تشغيل أو تلف بيانات — نبدأ بالخطة الابتدائية
  }
  const init = createInitialData();
  await saveState(init);
  return init;
}

export async function saveState({ meds, settings, history }) {
  await Promise.all([
    AsyncStorage.setItem(K.meds, JSON.stringify(meds)),
    AsyncStorage.setItem(K.settings, JSON.stringify(settings)),
    AsyncStorage.setItem(K.history, JSON.stringify(history || {})),
  ]);
}
