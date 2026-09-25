import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useApp } from '../store/AppContext';
import { DATE_RE } from '../utils/time';
import { Card, SectionTitle, PrimaryButton } from '../components/ui';
import { COLORS, FONT } from '../theme';

const TESTS = [
  { n: 'CRP', ar: 'بروتين سي التفاعلي' },
  { n: 'ESR', ar: 'سرعة ترسيب الدم' },
  { n: 'Serum Uric Acid', ar: 'حمض اليوريك' },
];

export default function LabsScreen() {
  const { settings, updateSettings } = useApp();
  const [text, setText] = useState(settings.labDate);
  useEffect(() => setText(settings.labDate), [settings.labDate]);

  const daysLeft = settings.labDate ? differenceInCalendarDays(parseISO(settings.labDate), new Date()) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Card style={[styles.countCard, daysLeft !== null && daysLeft <= 7 && daysLeft >= 0 && { backgroundColor: COLORS.dangerSoft, borderColor: COLORS.dangerSoft }]}>
        {daysLeft === null ? (
          <Text style={styles.countNum}>حدد موعد التحاليل</Text>
        ) : daysLeft > 0 ? (
          <>
            <Text style={styles.countNum}>{daysLeft}</Text>
            <Text style={styles.countUnit}>يوم متبقي على موعد التحاليل</Text>
            <Text style={styles.countDate}>{format(parseISO(settings.labDate), 'EEEE، d MMMM yyyy', { locale: ar })}</Text>
          </>
        ) : daysLeft === 0 ? (
          <>
            <Text style={styles.countNum}>اليوم 🔔</Text>
            <Text style={styles.countUnit}>موعدك اليوم — حان وقت إعادة التحاليل</Text>
          </>
        ) : (
          <>
            <Text style={styles.countNum}>تأخرت {-daysLeft} يوم</Text>
            <Text style={styles.countUnit}>راجع الطبيب وحدد موعدك بأقرب فرصة</Text>
          </>
        )}
      </Card>

      {daysLeft !== null && daysLeft <= 7 && daysLeft >= 0 && (
        <Card style={{ backgroundColor: COLORS.dangerSoft, borderColor: COLORS.dangerSoft }}>
          <Text style={styles.warn}>⏰ اقترب موعد التحاليل — جهّز نفسك ولا تنسَ الاستفسار عن فضاء الصيام إن لزم.</Text>
        </Card>
      )}

      <SectionTitle>التحاليل المطلوبة</SectionTitle>
      {TESTS.map((t) => (
        <View key={t.n} style={styles.testRow}>
          <Text style={styles.testName}>{t.n}</Text>
          <Text style={styles.testAr}>{t.ar}</Text>
        </View>
      ))}

      <Card>
        <SectionTitle>تغيير موعد التحاليل</SectionTitle>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="yyyy-mm-dd"
          placeholderTextColor={COLORS.sub}
          autoCapitalize="none"
        />
        <PrimaryButton title="حفظ الموعد" onPress={() => {
          if (!DATE_RE.test(text)) { Alert.alert('التاريخ غير صحيح', 'اكتبه بصيغة yyyy-mm-dd'); return; }
          updateSettings({ labDate: text });
          Alert.alert('تم الحفظ ✅');
        }} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  countCard: { alignItems: 'center', paddingVertical: 28 },
  countNum: { fontFamily: FONT.bold, fontSize: 52, color: COLORS.primary },
  countUnit: { fontFamily: FONT.semi, fontSize: 16, color: COLORS.text, marginTop: 6 },
  countDate: { fontFamily: FONT.regular, fontSize: 14, color: COLORS.sub, marginTop: 4 },
  warn: { fontFamily: FONT.semi, fontSize: 14.5, color: COLORS.danger },
  testRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8,
  },
  testName: { fontFamily: FONT.bold, fontSize: 16, color: COLORS.primary, width: 130 },
  testAr: { fontFamily: FONT.regular, fontSize: 15, color: COLORS.text, flex: 1 },
  input: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontFamily: FONT.regular, fontSize: 15, color: COLORS.text, marginBottom: 8,
  },
});
