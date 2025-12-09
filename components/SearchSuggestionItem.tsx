import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SearchSuggestionItem({ item, onPress }: { item: { title: string; address: string }; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Ionicons name="location" size={20} color="#1d4ed8" style={{ marginRight: 10 }} />

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {item.address}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 0.7,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 15,
    color: "#111",
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
});
