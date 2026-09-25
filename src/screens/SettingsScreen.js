import React from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Alert } from 'react-native';
import { useApp } from '../store/AppContext';
import { MEALS_AR, MEAL_KEYS } from '../utils/time';
import { sendTestNotification, rescheduleAll } from '../services/notifications';
import { Card, SectionTitle, PrimaryButton, TimePickerField } from '../components/ui';
import { COLORS, FONT } from '../theme';

function MealRow({ label, value, onSave }) {
  return (
    <View style={styles.mealRow}>
      <Text style={styles.mealLabel}>{label}</Text>
      <TimePickerField value={value} onChange={onSave} />
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const { meds, settings, updateSettings, permission } = useApp();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Card>
        <SectionTitle>مواعيد الوجبات</SectionTitle>
        <Text style={styles.note}>الجرعات "قبل/بعد الأكل" تُحسب تلقائيًا من هذه المواعيد (قبل/بعد بنصف ساعة).</Text>
        {MEAL_KEYS.map((k) => (
          <MealRow
            key={k}
            label={MEALS_AR[k]}
            value={settings.meals[k]}
            onSave={(t) => {
              updateSettings({ meals: { ...settings.meals, [k]: t } });
              Alert.alert('تم الحفظ ✅', 'تمت إعادة جدولة التنبيهات بالمواعيد الجديدة.');
            }}
          />
        ))}
      </Card>

      <Card>
        <SectionTitle>صور الأدوية</SectionTitle>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ flex: 1, fontFamily: FONT.regular, fontSize: 15, color: COLORS.text }}>إظهار صور العلب</Text>
          <Switch value={settings.showPhotos} onValueChange={(v) => updateSettings({ showPhotos: v })} trackColor={{ true: COLORS.primary }} thumbColor="#fff" />
        </View>
        <Text style={styles.note}>عند الإيقاف تظهر أيقونة موحدة لكل دواء.</Text>
      </Card>

      <Card>
        <SectionTitle>التنبيهات</SectionTitle>
        <Text style={styles.note}>حالة الإذن: {permission === 'granted' ? '✅ مسموح' : '⚠️ غير مسموح — اسمح بالإشعارات من إعدادات الجهاز'}</Text>
        <PrimaryButton outline title="🔔 جرّب التنبيه الآن" onPress={sendTestNotification} />
        <PrimaryButton outline title="🔄 إعادة جدولة كل التنبيهات" onPress={async () => { await rescheduleAll(meds, settings, { full: true }); Alert.alert('تمت إعادة الجدولة ✅'); }} />
        <PrimaryButton title="🛠 التنبيهات والتذكيرات الدقيقة" onPress={() => navigation.navigate('Troubleshoot')} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  note: { fontFamily: FONT.regular, fontSize: 13, color: COLORS.sub, marginBottom: 8 },
  mealRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  mealLabel: { flex: 1, fontFamily: FONT.semi, fontSize: 15, color: COLORS.text },
});
