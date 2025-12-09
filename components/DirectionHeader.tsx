import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  originName: string;
  destinationName: string;
  onEditPress?: () => void;
  onSwapPress?: () => void; 
};

const DirectionHeader: React.FC<Props> = ({
  originName,
  destinationName,
  onEditPress,
  onSwapPress,
}) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.iconColumn}>
          <View style={styles.originIconWrapper}>
            <View style={styles.originDot} />
          </View>

          <View style={styles.verticalLine} />

          <View style={styles.destIconWrapper}>
            <Ionicons name="location-sharp" size={18} color="#ef4444" />
          </View>
        </View>

        <View style={styles.textColumn}>
          <View style={styles.rowBlock}>
            <Text style={styles.label}>From</Text>
            <Text style={styles.placeName} numberOfLines={1}>
              {originName}
            </Text>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.smallDivider} />

            {onSwapPress ? (
              <TouchableOpacity
                onPress={onSwapPress}
                activeOpacity={0.85}
                style={styles.swapButton}
              >
                <Ionicons
                  name="swap-vertical"
                  size={16}
                  color="#2563eb"
                />
              </TouchableOpacity>
            ) : (
              <Ionicons
                name="arrow-down"
                size={14}
                color="#9ca3af"
                style={{ marginHorizontal: 4 }}
              />
            )}

            <View style={styles.smallDivider} />
          </View>

          <View style={styles.rowBlock}>
            <Text style={styles.label}>To</Text>
            <Text style={styles.placeName} numberOfLines={1}>
              {destinationName}
            </Text>
          </View>
        </View>

        {onEditPress && (
          <TouchableOpacity
            onPress={onEditPress}
            activeOpacity={0.85}
            style={styles.editButton}
          >
            <Ionicons name="pencil" size={16} color="#1d4ed8" />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default DirectionHeader;

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 26,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  iconColumn: {
    alignItems: "center",
    marginRight: 10,
  },
  originIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  originDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16a34a",
  },
  verticalLine: {
    width: 2,
    flexGrow: 1,
    backgroundColor: "#e5e7eb",
  },
  destIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  textColumn: {
    flex: 1,
  },
  rowBlock: {
    flexDirection: "column",
  },
  label: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 1,
  },
  placeName: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  smallDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },

  swapButton: {
    marginHorizontal: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e0edff",
    alignItems: "center",
    justifyContent: "center",
  },

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#eff6ff",
  },
  editText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#1d4ed8",
    fontWeight: "600",
  },
});
