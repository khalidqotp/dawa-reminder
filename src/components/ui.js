import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { COLORS, FONT } from '../theme';
import { to12Hour, from12Hour, formatTimeAr12 } from '../utils/time';

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function PrimaryButton({ title, onPress, color = COLORS.primary, outline = false, small = false, disabled = false }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.btn,
        small && styles.btnSmall,
        outline ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: color } : { backgroundColor: color },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text style={[styles.btnText, small && styles.btnTextSmall, outline && { color }]}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ProgressBar({ value }) {
  const w = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <View style={styles.pbarTrack}>
      <View style={[styles.pbarFill, { width: w + '%' }]} />
    </View>
  );
}

export function EmptyBox({ text }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function DoseRow({ dose, record, onTake, showDate }) {
  const taken = record && record.status === 'taken';
  const missed = record && record.status === 'missed';
  return (
    <View style={[styles.doseRow, taken && { backgroundColor: COLORS.taken }, missed && { backgroundColor: COLORS.missed }]}>
      <View style={styles.doseTimeBox}>
        <Text style={styles.doseTime}>{formatTimeAr12(dose.time)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.doseName}>{dose.name}</Text>
        <Text style={styles.doseSub}>
          {[dose.label, dose.doseText].filter(Boolean).join(' • ')}
        </Text>
        {showDate ? <Text style={styles.doseSub}>{dose.dateISO}</Text> : null}
      </View>
      {taken || missed ? (
        <Text style={[styles.statusText, { color: taken ? COLORS.primary : COLORS.danger }]}>
          {taken ? '✓ تم' : '✗ فاتت'}
        </Text>
      ) : (
        <PrimaryButton small title="تم أخذها ✓" onPress={() => onTake(dose.key)} />
      )}
    </View>
  );
}

// عمود ضبط رقمي كبير (ساعة أو دقيقة) بدقة تامة — بديل عن الكتابة الحرة
function StepperColumn({ label, value, min, max, onChange, pad }) {
  const bump = (dir) => {
    let v = value + dir;
    if (v > max) v = min;
    if (v < min) v = max;
    onChange(v);
  };
  return (
    <View style={styles.stepperCol}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <TouchableOpacity style={styles.stepBtn} onPress={() => bump(1)} activeOpacity={0.7}>
        <Text style={styles.stepBtnText}>﹢</Text>
      </TouchableOpacity>
      <View style={styles.stepperValueBox}>
        <Text style={styles.stepperValue}>{String(value).padStart(pad, '0')}</Text>
      </View>
      <TouchableOpacity style={styles.stepBtn} onPress={() => bump(-1)} activeOpacity={0.7}>
        <Text style={styles.stepBtnText}>﹣</Text>
      </TouchableOpacity>
    </View>
  );
}

// حقل اختيار وقت بدقة الدقيقة الواحدة، بصيغة 12 ساعة بالعربي — بدون كتابة حرة وبدون رجوع صامت لقيمة خاطئة
export function TimePickerField({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const initial = to12Hour(value || '08:00');
  const [hour12, setHour12] = useState(initial.hour12);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState(initial.period);

  useEffect(() => {
    const t = to12Hour(value || '08:00');
    setHour12(t.hour12); setMinute(t.minute); setPeriod(t.period);
  }, [value, open]);

  function confirm() {
    onChange(from12Hour(hour12, minute, period));
    setOpen(false);
  }

  return (
    <>
      {label ? <Text style={styles.timeFieldLabel}>{label}</Text> : null}
      <TouchableOpacity style={styles.timeFieldBox} onPress={() => setOpen(true)} activeOpacity={0.75}>
        <Text style={styles.timeFieldText}>{formatTimeAr12(value || '08:00')}</Text>
        <Text style={styles.timeFieldIcon}>🕐</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>تحديد الوقت بدقة</Text>
            <View style={styles.stepperRow}>
              <StepperColumn label="الساعة" value={hour12} min={1} max={12} pad={1} onChange={setHour12} />
              <Text style={styles.stepperColon}>:</Text>
              <StepperColumn label="الدقيقة" value={minute} min={0} max={59} pad={2} onChange={setMinute} />
              <View style={styles.periodCol}>
                <Text style={styles.stepperLabel}> </Text>
                <Chip label="صباحًا" active={period === 'ص'} onPress={() => setPeriod('ص')} />
                <Chip label="مساءً" active={period === 'م'} onPress={() => setPeriod('م')} />
              </View>
            </View>
            <Text style={styles.modalPreview}>{formatTimeAr12(from12Hour(hour12, minute, period))}</Text>
            <View style={styles.modalActions}>
              <View style={{ flex: 1 }}><PrimaryButton outline title="إلغاء" onPress={() => setOpen(false)} /></View>
              <View style={{ flex: 1 }}><PrimaryButton title="تم" onPress={confirm} /></View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: { fontFamily: FONT.bold, fontSize: 17, color: COLORS.text, marginBottom: 10, marginTop: 6 },
  btn: {
    borderRadius: 12, paddingVertical: 13, paddingHorizontal: 20,
    alignItems: 'center', justifyContent: 'center', marginVertical: 4,
  },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginVertical: 0 },
  btnText: { fontFamily: FONT.bold, fontSize: 16, color: '#fff' },
  btnTextSmall: { fontSize: 13 },
  chip: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 14, marginBottom: 8, backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontFamily: FONT.semi, fontSize: 14, color: COLORS.text },
  pbarTrack: { height: 8, backgroundColor: COLORS.border, borderRadius: 6, overflow: 'hidden', marginTop: 6 },
  pbarFill: { height: 8, backgroundColor: COLORS.primary, borderRadius: 6 },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { fontFamily: FONT.regular, color: COLORS.sub, fontSize: 15 },
  doseRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
    padding: 12, marginBottom: 8, gap: 12,
  },
  doseTimeBox: {
    backgroundColor: COLORS.primarySoft, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 10, minWidth: 62, alignItems: 'center',
  },
  doseTime: { fontFamily: FONT.bold, fontSize: 16, color: COLORS.primary },
  doseName: { fontFamily: FONT.semi, fontSize: 15.5, color: COLORS.text },
  doseSub: { fontFamily: FONT.regular, fontSize: 12.5, color: COLORS.sub, marginTop: 2 },
  statusText: { fontFamily: FONT.bold, fontSize: 14 },
  timeFieldLabel: { fontFamily: FONT.semi, fontSize: 13.5, color: COLORS.sub, marginBottom: 6, marginTop: 6 },
  timeFieldBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, alignSelf: 'flex-start', minWidth: 130,
  },
  timeFieldText: { fontFamily: FONT.bold, fontSize: 17, color: COLORS.primary },
  timeFieldIcon: { fontSize: 16 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20,30,26,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontFamily: FONT.bold, fontSize: 17, color: COLORS.text, textAlign: 'center', marginBottom: 16 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  stepperCol: { alignItems: 'center', gap: 8 },
  periodCol: { alignItems: 'center', gap: 8 },
  stepperLabel: { fontFamily: FONT.semi, fontSize: 12.5, color: COLORS.sub },
  stepperColon: { fontFamily: FONT.bold, fontSize: 26, color: COLORS.text, marginTop: 18 },
  stepBtn: {
    width: 44, height: 40, borderRadius: 10, backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { fontFamily: FONT.bold, fontSize: 20, color: COLORS.primary },
  stepperValueBox: {
    width: 60, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.bg,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  stepperValue: { fontFamily: FONT.bold, fontSize: 22, color: COLORS.text },
  modalPreview: { fontFamily: FONT.bold, fontSize: 24, color: COLORS.primary, textAlign: 'center', marginTop: 18, marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
});
