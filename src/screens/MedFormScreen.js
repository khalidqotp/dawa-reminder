import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Image, Alert } from 'react-native';
import { addDays, addMonths, format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useApp } from '../store/AppContext';
import { todayISO, WEEKDAYS_AR, MEALS_AR, MEAL_KEYS, RELATIONS_AR, FORMS_AR, DATE_RE } from '../utils/time';
import { Card, SectionTitle, PrimaryButton, Chip, TimePickerField } from '../components/ui';
import { COLORS, FONT } from '../theme';

const SCHEDULE_TYPES = [
  { key: 'daily', label: 'يومي بأوقات محددة' },
  { key: 'mealLinked', label: 'مرتبط بالوجبات' },
  { key: 'alternate', label: 'يوم نعم / يوم لا' },
  { key: 'weekly', label: 'أسبوعي' },
];

const EMPTY = {
  name: '', form: 'قرص', doseText: '',
  scheduleType: 'daily',
  times: ['08:00', '14:00', '20:00'],
  mealLinks: [
    { meal: 'breakfast', relation: 'before' },
    { meal: 'lunch', relation: 'before' },
    { meal: 'dinner', relation: 'before' },
  ],
  weekday: 0,
  startDate: todayISO(),
  endDate: '',
  photo: null,
  alwaysOffSunday: true,
  enabled: true,
};

function DateInput({ value, onChange, placeholder }) {
  return (
    <TextInput
      style={styles.input}
      value={value || ''}
      onChangeText={onChange}
      placeholder={placeholder || 'yyyy-mm-dd'}
      placeholderTextColor={COLORS.sub}
      autoCapitalize="none"
    />
  );
}

export default function MedFormScreen({ route, navigation }) {
  const { saveMed } = useApp();
  const [med, setMed] = useState(() => {
    if (route.params && route.params.med) return JSON.parse(JSON.stringify(route.params.med));
    return { ...EMPTY, id: 'm_' + Date.now() };
  });
  const set = (patch) => setMed((m) => ({ ...m, ...patch }));

  async function pickPhoto() {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (!res.canceled && res.assets && res.assets[0]) {
        const uri = res.assets[0].uri;
        const dest = FileSystem.documentDirectory + `med_${Date.now()}.jpg`;
        await FileSystem.copyAsync({ from: uri, to: dest });
        set({ photo: dest });
      }
    } catch (e) {
      Alert.alert('تعذر اختيار الصورة');
    }
  }

  function validate() {
    if (!med.name.trim()) { Alert.alert('من فضلك اكتب اسم الدواء'); return false; }
    if (!DATE_RE.test(med.startDate)) { Alert.alert('تاريخ البداية غير صحيح', 'اكتبه بصيغة yyyy-mm-dd'); return false; }
    if (med.endDate && !DATE_RE.test(med.endDate)) { Alert.alert('تاريخ النهاية غير صحيح'); return false; }
    return true;
  }

  const st = med.scheduleType;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      <Card>
        <SectionTitle>الدواء</SectionTitle>
        <Text style={styles.label}>الاسم</Text>
        <TextInput style={styles.input} value={med.name} onChangeText={(v) => set({ name: v })} placeholder="مثال: Apetoid 20mg" placeholderTextColor={COLORS.sub} />
        <Text style={styles.label}>الشكل</Text>
        <View style={styles.chipsRow}>
          {FORMS_AR.map((f) => <Chip key={f} label={f} active={med.form === f} onPress={() => set({ form: f })} />)}
        </View>
        <Text style={styles.label}>وصف الجرعة</Text>
        <TextInput style={styles.input} value={med.doseText} onChangeText={(v) => set({ doseText: v })} placeholder="مثال: قرص واحد بعد الغداء" placeholderTextColor={COLORS.sub} />
      </Card>

      <Card>
        <SectionTitle>الجدولة</SectionTitle>
        <View style={styles.chipsRow}>
          {SCHEDULE_TYPES.map((t) => <Chip key={t.key} label={t.label} active={st === t.key} onPress={() => set({ scheduleType: t.key })} />)}
        </View>

        {st === 'daily' && (
          <View>
            <Text style={styles.label}>الأوقات</Text>
            {med.times.map((t, i) => (
              <View key={i} style={styles.timeRow}>
                <TimePickerField value={t} onChange={(v) => { const times = [...med.times]; times[i] = v; set({ times }); }} />
                <PrimaryButton small outline color={COLORS.danger} title="حذف" onPress={() => set({ times: med.times.filter((_, j) => j !== i) })} />
              </View>
            ))}
            <PrimaryButton small outline title="＋ إضافة وقت" onPress={() => set({ times: [...med.times, '08:00'] })} />
          </View>
        )}

        {st === 'mealLinked' && (
          <View>
            <Text style={styles.label}>الجرعات المرتبطة بالوجبات (تحسب تلقائيًا من مواعيد الوجبات في الإعدادات)</Text>
            {med.mealLinks.map((l, i) => (
              <View key={i} style={{ marginBottom: 10 }}>
                <View style={styles.chipsRow}>
                  {['before', 'after'].map((r) => (
                    <Chip key={r} label={RELATIONS_AR[r]} active={l.relation === r} onPress={() => { const ml = [...med.mealLinks]; ml[i] = { ...l, relation: r }; set({ mealLinks: ml }); }} />
                  ))}
                </View>
                <View style={styles.chipsRow}>
                  {MEAL_KEYS.map((k) => (
                    <Chip key={k} label={MEALS_AR[k]} active={l.meal === k} onPress={() => { const ml = [...med.mealLinks]; ml[i] = { ...l, meal: k }; set({ mealLinks: ml }); }} />
                  ))}
                  <PrimaryButton small outline color={COLORS.danger} title="حذف" onPress={() => set({ mealLinks: med.mealLinks.filter((_, j) => j !== i) })} />
                </View>
              </View>
            ))}
            <PrimaryButton small outline title="＋ إضافة جرعة مرتبطة بوجبة" onPress={() => set({ mealLinks: [...med.mealLinks, { meal: 'breakfast', relation: 'after' }] })} />
          </View>
        )}

        {st === 'alternate' && (
          <View>
            <Text style={styles.label}>وقت الجرعة في أيام "نعم"</Text>
            <TimePickerField value={(med.times || [])[0] || '00:30'} onChange={(v) => set({ times: [v] })} />
            <Text style={styles.note}>الأحد دائمًا بدون جرعة، ولا يُحتسب من التبديل ولا يزحلق الجدول.</Text>
          </View>
        )}

        {st === 'weekly' && (
          <View>
            <Text style={styles.label}>يوم الأسبوع</Text>
            <View style={styles.chipsRow}>
              {WEEKDAYS_AR.map((wd, i) => (
                <Chip key={wd} label={wd} active={med.weekday === i} onPress={() => set({ weekday: i })} />
              ))}
            </View>
            <Text style={styles.label}>الوقت</Text>
            <TimePickerField value={(med.times || [])[0] || '10:00'} onChange={(v) => set({ times: [v] })} />
            <Text style={styles.note}>يمكن تغيير يوم الحقنة بسهولة في أي وقت من هنا.</Text>
          </View>
        )}
      </Card>

      <Card>
        <SectionTitle>فترة العلاج</SectionTitle>
        <Text style={styles.label}>تاريخ البداية</Text>
        <DateInput value={med.startDate} onChange={(v) => set({ startDate: v })} />
        <Text style={styles.label}>تاريخ النهاية (اتركه فارغًا للاستمرار)</Text>
        <DateInput value={med.endDate} onChange={(v) => set({ endDate: v })} />
        <View style={styles.chipsRow}>
          <Chip label="البداية اليوم" active={false} onPress={() => set({ startDate: todayISO() })} />
          <Chip label="النهاية بعد 3 شهور" active={false} onPress={() => set({ endDate: format(addMonths(new Date(), 3), 'yyyy-MM-dd') })} />
          <Chip label="بدون نهاية" active={false} onPress={() => set({ endDate: '' })} />
        </View>
      </Card>

      <Card>
        <SectionTitle>صورة العلبة (اختياري)</SectionTitle>
        {med.photo ? <Image source={{ uri: med.photo }} style={styles.bigPhoto} /> : null}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><PrimaryButton small outline title={med.photo ? 'تغيير الصورة' : 'اختيار صورة'} onPress={pickPhoto} /></View>
          {med.photo ? <View style={{ flex: 1 }}><PrimaryButton small outline color={COLORS.danger} title="إزالة الصورة" onPress={() => set({ photo: null })} /></View> : null}
        </View>
      </Card>

      <PrimaryButton title="💾 حفظ" onPress={() => { if (validate()) { saveMed(med); navigation.goBack(); } }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  label: { fontFamily: FONT.semi, fontSize: 13.5, color: COLORS.sub, marginBottom: 6, marginTop: 6 },
  input: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontFamily: FONT.regular, fontSize: 15, color: COLORS.text,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  note: { fontFamily: FONT.regular, fontSize: 12.5, color: COLORS.accent, marginTop: 8 },
  bigPhoto: { width: '100%', height: 180, borderRadius: 12, marginBottom: 10, resizeMode: 'contain', backgroundColor: COLORS.bg },
});
