import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { EventBus, type PlaceSelectedPayload } from "@/utils/EventBus";

type SearchResult = {
  id: string;
  title: string;
  address: string;
  lat: number;
  lon: number;
};

type ActiveField = "start" | "destination";

const SearchPlace: React.FC = () => {
  const router = useRouter();

  const [activeField, setActiveField] = useState<ActiveField>("destination");

  const [startQuery, setStartQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentLocLoading, setCurrentLocLoading] = useState(false);
  const [currentLoc, setCurrentLoc] =
    useState<PlaceSelectedPayload | null>(null);

  const [startPlace, setStartPlace] =
    useState<PlaceSelectedPayload | null>(null);
  const [destinationPlace, setDestinationPlace] =
    useState<PlaceSelectedPayload | null>(null);

  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const activeQuery = activeField === "start" ? startQuery : destQuery;


  useEffect(() => {
    (async () => {
      setCurrentLocLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setCurrentLocLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const lat = loc.coords.latitude;
        const lon = loc.coords.longitude;

        const url =
          `https://nominatim.openstreetmap.org/reverse?` +
          `format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`;

        const res = await fetch(url, {
          headers: { "User-Agent": "ReactNativeLocationApp/1.0" },
        });

        const json = await res.json();

        const displayName: string = json.display_name ?? "Current Location";
        const shortName = displayName.split(",")[0];

        const payload: PlaceSelectedPayload = {
          name: shortName,
          address: displayName,
          lat,
          lon,
        };

        setCurrentLoc(payload);
        setStartPlace((prev) => prev ?? payload);
        setStartQuery((prev) => (prev ? prev : payload.name));
      } catch (err) {
        console.log("Current location reverse geocode failed:", err);
        setCurrentLoc(null);
      } finally {
        setCurrentLocLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!activeQuery || activeQuery.length < 2) {
      setResults([]);
      fadeAnim.setValue(0);
      return;
    }

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
      searchPlaces(activeQuery);
    }, 400);
  }, [activeQuery, activeField]);

  const searchPlaces = async (text: string) => {
    setLoading(true);
    try {
      const url =
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=8`;

      const res = await fetch(url, {
        headers: { "User-Agent": "ReactNativeLocationApp/1.0" },
      });
      const json = await res.json();

      const formatted: SearchResult[] = json.map((item: any, index: number) => ({
        id: String(index),
        title: item.display_name.split(",")[0],
        address: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }));

      setResults(formatted);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.log("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyPlaceSelection = (payload: PlaceSelectedPayload) => {
    if (activeField === "start") {
      setStartPlace(payload);
      setStartQuery(payload.name);
    } else {
      setDestinationPlace(payload);
      setDestQuery(payload.name);
      EventBus.emitPlaceSelected(payload);
      router.back();
    }

    setResults([]);
    fadeAnim.setValue(0);
  };

  /*selects place from search bar*/
  const handleSelectFromSearch = (place: SearchResult) => {
    const payload: PlaceSelectedPayload = {
      name: place.title,
      address: place.address,
      lat: place.lat,
      lon: place.lon,
    };

    applyPlaceSelection(payload);
  };

  const clearQuery = () => {
    if (activeField === "start") {
      setStartQuery("");
    } else {
      setDestQuery("");
    }
    setResults([]);
    fadeAnim.setValue(0);
  };

  const isStartActive = activeField === "start";
  const isDestinationActive = activeField === "destination";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons
            name="arrow-back"
            size={22}
            color="#111827"
            style={{ marginTop: 30 }}
          />
        </TouchableOpacity>

        <Text style={styles.topTitle}>Choose route</Text>

        <View style={styles.iconBtn} />
      </View>

      <View style={styles.inputsCard}>

        <View
          style={[
            styles.inputRowWrapper,
            isStartActive && styles.inputRowActive,
          ]}
        >
          <View style={styles.inputRow}>
            <View style={styles.inputIconCircle}>
              <Ionicons
                name="radio-button-on-outline"
                size={16}
                color={isStartActive ? "#16a34a" : "#6b7280"}
              />
            </View>
            <View style={styles.inputTextCol}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Start location</Text>
                {currentLoc &&
                  startPlace &&
                  startPlace.lat === currentLoc.lat &&
                  startPlace.lon === currentLoc.lon && (
                    <View style={styles.chipDefault}>
                      <Text style={styles.chipDefaultText}>Default</Text>
                    </View>
                  )}
              </View>

              {currentLocLoading ? (
                <Text style={styles.inputValue}>Detecting your location...</Text>
              ) : null}

              <TextInput
                style={styles.destinationInput}
                placeholder={
                  startPlace ? startPlace.name : "Search start location"
                }
                value={startQuery}
                onFocus={() => setActiveField("start")}
                onChangeText={(text) => {
                  setStartQuery(text);
                  setActiveField("start");
                }}
              />
            </View>

            {isStartActive && startQuery.length > 0 && (
              <TouchableOpacity onPress={clearQuery} style={styles.clearIconBtn}>
                <Ionicons name="close" size={16} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.inputsDivider} />

        <View
          style={[
            styles.inputRowWrapper,
            isDestinationActive && styles.inputRowActive,
          ]}
        >
          <View style={styles.inputRow}>
            <View style={styles.inputIconCircle}>
              <Ionicons
                name="location-sharp"
                size={18}
                color={isDestinationActive ? "#ef4444" : "#6b7280"}
              />
            </View>
            <View style={styles.inputTextCol}>
              <Text style={styles.inputLabel}>Destination</Text>

              <TextInput
                style={styles.destinationInput}
                placeholder={
                  destinationPlace
                    ? destinationPlace.name
                    : "Search destination"
                }
                value={destQuery}
                onFocus={() => setActiveField("destination")}
                onChangeText={(text) => {
                  setDestQuery(text);
                  setActiveField("destination");
                }}
              />
            </View>

            {isDestinationActive && destQuery.length > 0 && (
              <TouchableOpacity onPress={clearQuery} style={styles.clearIconBtn}>
                <Ionicons name="close" size={16} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" />
          <Text style={styles.loadingText}>Searching places…</Text>
        </View>
      )}

      {/*autocomplete suggestion*/}
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-4, 0],
              }),
            },
          ],
        }}
      >
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => handleSelectFromSearch(item)}
            >
              <Ionicons
                name="location-outline"
                size={20}
                color="#1d4ed8"
                style={{ marginRight: 10, marginTop: 2 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.itemSubtitle} numberOfLines={2}>
                  {item.address}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListHeaderComponent={
            currentLoc ? (
              <TouchableOpacity
                style={styles.itemRowDefault}
                onPress={() => applyPlaceSelection(currentLoc)}
              >
                <Ionicons
                  name="locate"
                  size={18}
                  color="#16a34a"
                  style={{ marginRight: 10, marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    Use current location
                  </Text>
                  <Text style={styles.itemSubtitle} numberOfLines={2}>
                    {currentLoc.address}
                  </Text>
                </View>
                {isStartActive && (
                  <View style={styles.chipDefault}>
                    <Text style={styles.chipDefaultText}>Start</Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            !loading && activeQuery.length >= 2 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No places found. Try a different search.
                </Text>
              </View>
            ) : null
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
};

export default SearchPlace;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: "#f9fafb",
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginTop: 30,
  },
  iconBtn: {
    padding: 4,
    width: 32,
    alignItems: "center",
  },
  inputsCard: {
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  inputRowWrapper: {
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  inputRowActive: {
    backgroundColor: "#eff6ff",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  inputIconCircle: {
    height: 28,
    width: 28,
    borderRadius: 14,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  inputTextCol: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 2,
    marginRight: 6,
  },
  inputValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  inputSubValue: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 1,
  },
  destinationInput: {
    fontSize: 14,
    color: "#111827",
    paddingVertical: 0,
    paddingRight: 30,
  },
  clearIconBtn: {
    padding: 4,
    marginLeft: 6,
  },
  inputsDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 4,
    marginLeft: 38,
  },

  chipDefault: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#ecfdf3",
  },
  chipDefaultText: {
    fontSize: 10,
    color: "#16a34a",
    fontWeight: "600",
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#6b7280",
  },

  itemRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.6,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  itemRowDefault: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.6,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  itemSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },

  emptyState: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 13,
    color: "#6b7280",
  },
});
