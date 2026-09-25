import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, Platform } from 'react-native';
import { useApp } from '../store/AppContext';
import { sendTestNotification } from '../services/notifications';
import { Card, SectionTitle, PrimaryButton } from '../components/ui';
import { COLORS, FONT } from '../theme';

const STEPS = [
  'افتح "إعدادات" الجهاز ← "التطبيقات" ← "دوائي" ← "البطارية" واختر "غير مقيّد" (Unrestricted) أو "بدون تحسين".',
  'تأكد أن "السماح بالتشغيل في الخلفية" مفعّل لتطبيق دوائي.',
  'افتح قائمة التطبيقات الأخيرة، اسحب بطاقة دوائي للأسفل (أو اضغط مطولًا) واختر "قفل" حتى لا يغلقه النظام.',
  'عطّل "تحسين البطارية التكيّفي" الخاص بالتطبيق إن وُجد (سامسونج: عناية بالجهاز ← استخدام البطارية ← دوائي ← غير مقيّد).',
  'في شاومي/أوبو/فيفو: الإعدادات ← البطارية ← أداء/إدارة الخلفية ← دوائي ← "بدون قيود".',
  'أعد تشغيل الهاتف بعد التعديلات ثم افتح دوائي مرة واحدة لإعادة الجدولة.',
];

export default function TroubleshootScreen() {
  const { meds, settings } = useApp();
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Card style={{ backgroundColor: COLORS.primarySoft, borderColor: COLORS.primarySoft }}>
        <Text style={styles.intro}>هذه الخطوات تمنع النظام من تأخير أو كتم تنبيهات الأدوية خاصةً في وضع الخمول (Doze).</Text>
      </Card>

      <Card>
        <SectionTitle>خطوات إيقاف تحسين البطارية</SectionTitle>
        {STEPS.map((s, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
            <Text style={styles.stepText}>{s}</Text>
          </View>
        ))}
      </Card>

      <PrimaryButton title="⚙️ فتح إعدادات التطبيق" onPress={() => Linking.openSettings().catch(() => {})} />
      <PrimaryButton outline title="🔔 جرّب صوت التنبيه" onPress={sendTestNotification} />
      <Text style={styles.foot}>إذا سمعت الصوت بعد 3 ثوانٍ فالتنبيهات تعمل بشكل سليم.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  intro: { fontFamily: FONT.semi, fontSize: 14.5, color: COLORS.primary },
  stepRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start', gap: 10 },
  stepNum: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: '#fff', fontFamily: FONT.bold, fontSize: 14 },
  stepText: { flex: 1, fontFamily: FONT.regular, fontSize: 14, color: COLORS.text, lineHeight: 22 },
  foot: { fontFamily: FONT.regular, fontSize: 12.5, color: COLORS.sub, textAlign: 'center', marginTop: 10 },
});
