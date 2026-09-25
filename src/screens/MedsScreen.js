import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Switch } from 'react-native';
import { useApp } from '../store/AppContext';
import { describeSchedule, FORM_ICONS } from '../utils/time';
import { Card, PrimaryButton } from '../components/ui';
import { COLORS, FONT } from '../theme';

export default function MedsScreen({ navigation }) {
  const { meds, settings, deleteMed, saveMed } = useApp();
  const [confirmId, setConfirmId] = useState(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      {meds.map((med) => (
        <Card key={med.id}>
          <View style={styles.row}>
            <View style={styles.iconBox}>
              {settings.showPhotos && med.photo ? (
                <Image source={{ uri: med.photo }} style={styles.photo} />
              ) : (
                <Text style={{ fontSize: 26 }}>{FORM_ICONS[med.form] || '💊'}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{med.name}</Text>
              <Text style={styles.sub}>{describeSchedule(med, settings)}</Text>
              <Text style={styles.sub}>{med.doseText}</Text>
              <Text style={styles.dates}>من {med.startDate} إلى {med.endDate || 'مستمر'}</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <PrimaryButton small outline title="تعديل" onPress={() => navigation.navigate('MedForm', { med })} />
            {confirmId === med.id ? (
              <>
                <PrimaryButton small color={COLORS.danger} title="تأكيد الحذف" onPress={() => { deleteMed(med.id); setConfirmId(null); }} />
                <PrimaryButton small outline title="إلغاء" onPress={() => setConfirmId(null)} />
              </>
            ) : (
              <PrimaryButton small outline color={COLORS.danger} title="حذف" onPress={() => setConfirmId(med.id)} />
            )}
            <View style={{ flex: 1 }} />
            <Switch value={med.enabled !== false} onValueChange={(v) => saveMed({ ...med, enabled: v })} trackColor={{ true: COLORS.primary }} thumbColor="#fff" />
          </View>
        </Card>
      ))}
      <PrimaryButton title="＋ إضافة دواء جديد" onPress={() => navigation.navigate('MedForm', {})} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: {
    width: 52, height: 52, borderRadius: 12, backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  photo: { width: 52, height: 52, borderRadius: 12 },
  name: { fontFamily: FONT.bold, fontSize: 16, color: COLORS.text },
  sub: { fontFamily: FONT.regular, fontSize: 13, color: COLORS.sub, marginTop: 2 },
  dates: { fontFamily: FONT.regular, fontSize: 12, color: COLORS.accent, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
});
