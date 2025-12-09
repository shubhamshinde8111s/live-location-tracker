import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import type { TransportMode } from '@/services/directions';

type Props = {
  value: TransportMode;
  onChange: (mode: TransportMode) => void;
  activeDurationText?: string;
};

const BLUE = '#1d4ed8';

const TransportModeSelector: React.FC<Props> = ({ value, onChange, activeDurationText }) => {
  const modes: { key: TransportMode; label: string; icon: React.ReactNode }[] = [
    { key: 'driving', label: 'Car', icon: <Ionicons name="car-outline" size={20} color="#111827" /> },
    {
      key: 'bicycling',
      label: 'Bike',
      icon: <MaterialCommunityIcons name="bike" size={20} color="#111827" />,
    },
    { key: 'walking', label: 'Walk', icon: <Ionicons name="walk-outline" size={20} color="#111827" /> },
    {
      key: 'transit',
      label: 'Train',
      icon: <MaterialIcons name="train" size={20} color="#111827" />,
    },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {modes.map((m) => {
          const active = value === m.key;
          return (
            <View key={m.key} style={styles.modeBlock}>
              <TouchableOpacity
                style={[styles.circle, active && styles.circleActive]}
                onPress={() => onChange(m.key)}
              >
                {React.cloneElement(m.icon as React.ReactElement, {
                  color: active ? BLUE : '#9ca3af',
                } as any)}
              </TouchableOpacity>
              <Text style={[styles.label, active && styles.labelActive]}>
                {active && activeDurationText ? activeDurationText : m.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default TransportModeSelector;

const styles = StyleSheet.create({
  wrapper: {
    marginTop: -18, 
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
  },
  modeBlock: {
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    marginBottom: 4,
  },
  circleActive: {
    backgroundColor: '#e0edff',
  },
  label: {
    fontSize: 11,
    color: '#9ca3af',
  },
  labelActive: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
});

