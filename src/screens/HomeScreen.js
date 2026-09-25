import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useApp } from '../store/AppContext';
import { buildDosesForDate, todayISO } from '../utils/time';
import { Card, DoseRow, SectionTitle, ProgressBar, EmptyBox } from '../components/ui';
import { COLORS, FONT } from '../theme';

export default function HomeScreen() {
  const { meds, settings, history, markDose, refreshMissed } = useApp();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => { setNow(new Date()); refreshMissed(); }, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { refreshMissed(); }, []);

  const dateISO = todayISO();
  const doses = useMemo(() => buildDosesForDate(meds, settings, dateISO), [meds, settings]);
  const next = doses.find((d) => d.ts > now.getTime() && (!history[d.key] || history[d.key].status !== 'taken'));
  const done = doses.filter((d) => history[d.key] && history[d.key].status === 'taken').length;
  const adherence = doses.length ? done / doses.length : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => { setNow(new Date()); refreshMissed(); }} />}
    >
      <Text style={styles.date}>{format(now, 'EEEE، d MMMM yyyy', { locale: ar })}</Text>

      <Card style={styles.nextCard}>
        <Text style={styles.nextLabel}>الجرعة القادمة</Text>
        {next ? (
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.nextTime}>{next.time}</Text>
            <Text style={styles.nextName}>{next.name}</Text>
            <Text style={styles.nextSub}>{[next.label, next.doseText].filter(Boolean).join(' • ')}</Text>
          </View>
        ) : (
          <Text style={styles.nextDone}>لا توجد جرعات متبقية اليوم 🎉</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.adherenceText}>التزامك اليوم: {Math.round(adherence * 100)}٪ ({done} من {doses.length})</Text>
        <ProgressBar value={adherence} />
      </Card>

      <SectionTitle>جرعات اليوم</SectionTitle>
      {doses.length === 0 ? (
        <EmptyBox text="لا توجد جرعات مجدولة اليوم" />
      ) : (
        doses.map((d) => <DoseRow key={d.key} dose={d} record={history[d.key]} onTake={markDose} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  date: { fontFamily: FONT.semi, fontSize: 16, color: COLORS.sub, textAlign: 'center', marginBottom: 14 },
  nextCard: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primarySoft, alignItems: 'center' },
  nextLabel: { fontFamily: FONT.semi, fontSize: 14, color: COLORS.primary, marginBottom: 6 },
  nextTime: { fontFamily: FONT.bold, fontSize: 44, color: COLORS.primary },
  nextName: { fontFamily: FONT.bold, fontSize: 19, color: COLORS.text, marginTop: 4 },
  nextSub: { fontFamily: FONT.regular, fontSize: 14, color: COLORS.sub, marginTop: 2 },
  nextDone: { fontFamily: FONT.bold, fontSize: 17, color: COLORS.primary, marginTop: 6 },
  adherenceText: { fontFamily: FONT.semi, fontSize: 15, color: COLORS.text },
});
