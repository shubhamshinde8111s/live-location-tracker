import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { TransportMode } from "@/services/directions";

type Props = {
  distanceKm?: number;
  durationText?: string;
  mode: TransportMode;
  originSet: boolean;
  destinationSet: boolean;
  onModeChange: (mode: TransportMode) => void;
};

const MODE_CONFIG: Record<
  TransportMode,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  driving: { label: "Car", icon: "car" },
  bicycling: { label: "Bike", icon: "bicycle" },
  walking: { label: "Walk", icon: "walk" },
  transit: { label: "Train", icon: "train" },
};

const RouteInfoCard: React.FC<Props> = ({
  distanceKm,
  durationText,
  mode,
  originSet,
  destinationSet,
  onModeChange,
}) => {
  const infoReady =
    originSet &&
    destinationSet &&
    distanceKm != null &&
    typeof distanceKm === "number" &&
    !!durationText;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Ionicons name="navigate" size={14} color="#1d4ed8" />
          <Text style={styles.badgeText}>Best route</Text>
        </View>

        {infoReady && (
          <View style={styles.etaPill}>
            <Ionicons name="time-outline" size={14} color="#2563eb" />
            <Text style={styles.etaText}>{durationText}</Text>
          </View>
        )}
      </View>
      {infoReady ? (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="swap-horizontal" size={16} color="#4b5563" />
            <Text style={styles.statValue}>
              {distanceKm?.toFixed(1)} km
            </Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color="#4b5563" />
            <Text style={styles.statValue}>{durationText}</Text>
            <Text style={styles.statLabel}>ETA</Text>
          </View>
        </View>
      ) : originSet && destinationSet ? (
        <Text style={styles.subText}>Calculating route…</Text>
      ) : (
        <Text style={styles.subText}>
          Select a destination to see route details
        </Text>
      )}
      <View style={styles.modesRow}>
        {(Object.keys(MODE_CONFIG) as TransportMode[]).map((m) => {
          const cfg = MODE_CONFIG[m];
          const active = m === mode;

          return (
            <TouchableOpacity
              key={m}
              style={[styles.modeChip, active && styles.modeChipActive]}
              onPress={() => onModeChange(m)}
              activeOpacity={0.9}
            >
              <Ionicons
                name={cfg.icon}
                size={16}
                color={active ? "#1d4ed8" : "#6b7280"}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.modeLabel,
                  active && styles.modeLabelActive,
                ]}
              >
                {cfg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default RouteInfoCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#e0f2fe",
  },
  badgeText: {
    marginLeft: 4,
    fontSize: 11,
    color: "#1d4ed8",
    fontWeight: "600",
  },
  etaPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#eef2ff",
  },
  etaText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#1d4ed8",
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  statLabel: {
    marginTop: 1,
    fontSize: 11,
    color: "#6b7280",
  },
  verticalDivider: {
    width: 1,
    height: 26,
    backgroundColor: "#e5e7eb",
  },
  subText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
    marginTop: 2,
  },
  modesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  modeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    flex: 1,
    justifyContent: "center",
    marginRight: 6,
  },
  modeChipActive: {
    backgroundColor: "#dbeafe",
    borderColor: "#1d4ed8",
  },
  modeLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  modeLabelActive: {
    color: "#1d4ed8",
    fontWeight: "600",
  },
});
