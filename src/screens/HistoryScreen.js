import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { addDays, format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useApp } from '../store/AppContext';
import { buildDosesForDate, toISO } from '../utils/time';
import { Card, SectionTitle, ProgressBar, EmptyBox } from '../components/ui';
import { COLORS, FONT } from '../theme';

export default function HistoryScreen() {
  const { meds, settings, history } = useApp();

  const days = useMemo(() => {
    const out = [];
    for (let i = 0; i < 14; i++) {
      const dISO = toISO(addDays(new Date(), -i));
      const doses = buildDosesForDate(meds, settings, dISO);
      const taken = doses.filter((x) => history[x.key] && history[x.key].status === 'taken').length;
      const missed = doses.filter((x) => history[x.key] && history[x.key].status === 'missed').length;
      out.push({ dISO, doses, taken, missed });
    }
    return out;
  }, [meds, settings, history]);

  const records = useMemo(() => {
    return Object.entries(history)
      .map(([key, v]) => {
        const [medId, dateISO, time] = key.split('|');
        const med = meds.find((m) => m.id === medId);
        return { key, dateISO, time, name: med ? med.name : medId, ...v };
      })
      .sort((a, b) => b.at - a.at)
      .slice(0, 40);
  }, [history, meds]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <SectionTitle>آخر 14 يوم</SectionTitle>
      {days.map((d) => {
        const total = d.taken + d.missed;
        const pct = total ? d.taken / total : 0;
        return (
          <Card key={d.dISO} style={{ paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dayTitle}>{format(parseISO(d.dISO), 'EEEE d/M', { locale: ar })}</Text>
                <Text style={styles.daySub}>{d.taken} تمت • {d.missed} فاتت {total === 0 ? '(لا جرعات)' : ''}</Text>
              </View>
              <Text style={[styles.pct, { color: pct >= 0.8 ? COLORS.primary : pct >= 0.5 ? COLORS.accent : COLORS.danger }]}>
                {total ? Math.round(pct * 100) + '٪' : '—'}
              </Text>
            </View>
            <ProgressBar value={pct} />
          </Card>
        );
      })}

      <SectionTitle>آخر السجلات</SectionTitle>
      {records.length === 0 ? <EmptyBox text="لا توجد سجلات بعد" /> : records.map((r) => (
        <View key={r.key} style={[styles.recRow, r.status === 'taken' ? { backgroundColor: COLORS.taken } : { backgroundColor: COLORS.missed }]}>
          <Text style={styles.recIcon}>{r.status === 'taken' ? '✓' : '✗'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.recName}>{r.name}</Text>
            <Text style={styles.recSub}>{r.dateISO} — الساعة {r.time}</Text>
          </View>
          <Text style={[styles.recStatus, { color: r.status === 'taken' ? COLORS.primary : COLORS.danger }]}>
            {r.status === 'taken' ? 'تم أخذها' : 'فاتت'}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  dayTitle: { fontFamily: FONT.semi, fontSize: 15, color: COLORS.text },
  daySub: { fontFamily: FONT.regular, fontSize: 12.5, color: COLORS.sub, marginTop: 2 },
  pct: { fontFamily: FONT.bold, fontSize: 18 },
  recRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    padding: 12, marginBottom: 6,
  },
  recIcon: { fontFamily: FONT.bold, fontSize: 18, width: 28, color: COLORS.text },
  recName: { fontFamily: FONT.semi, fontSize: 14.5, color: COLORS.text },
  recSub: { fontFamily: FONT.regular, fontSize: 12, color: COLORS.sub, marginTop: 2 },
  recStatus: { fontFamily: FONT.bold, fontSize: 13 },
});
