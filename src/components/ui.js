import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT } from '../theme';

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
        <Text style={styles.doseTime}>{dose.time}</Text>
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
    paddingVertical: 8, paddingHorizontal: 14, marginRight: 8, marginBottom: 8, backgroundColor: '#fff',
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
    padding: 12, marginBottom: 8,
  },
  doseTimeBox: {
    backgroundColor: COLORS.primarySoft, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 10, marginRight: 12, minWidth: 62, alignItems: 'center',
  },
  doseTime: { fontFamily: FONT.bold, fontSize: 16, color: COLORS.primary },
  doseName: { fontFamily: FONT.semi, fontSize: 15.5, color: COLORS.text },
  doseSub: { fontFamily: FONT.regular, fontSize: 12.5, color: COLORS.sub, marginTop: 2 },
  statusText: { fontFamily: FONT.bold, fontSize: 14 },
});
