import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { LatLng } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import DirectionHeader from "@/components/DirectionHeader";
import MapRouteView from "@/components/MapRouteView";
import RouteBottomSheet from "@/components/RouteBottomSheet";
import RouteInfoCard from "@/components/RouteInfoCard";
import {
  fetchRoute,
  type RouteResult,
  type TransportMode,
} from "@/services/directions";
import { reverseGeocode } from "@/services/geocode";
import { EventBus, type PlaceSelectedPayload } from "@/utils/EventBus";

interface DestinationDetails {
  coords: LatLng;
  name: string;
  address: string;
}

interface OriginDetails {
  coords: LatLng;
  name: string;
  address: string;
}

type PoiCategory = "restaurant" | "cafe" | "atm";

const BLUE = "#1d4ed8";

const HomeScreen: React.FC = () => {
  const router = useRouter();

  //current GPS position
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);

  //origin name
  const [originDetails, setOriginDetails] = useState<OriginDetails | null>(
    null
  );

  //destination chosen by user
  const [destination, setDestination] = useState<DestinationDetails | null>(
    null
  );

  //route result (distance, duration, polyline)
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [mode, setMode] = useState<TransportMode>("driving");

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //nearby POIs
  const [selectedPoiCategory, setSelectedPoiCategory] =
    useState<PoiCategory | null>(null);
  const [poiLoading, setPoiLoading] = useState(false);
  const [poiPlaces, setPoiPlaces] = useState<
    { coords: LatLng; name: string }[]
  >([]);

  //derived coords used by Map + route
  const originCoords: LatLng | undefined =
    originDetails?.coords ??
    (currentLocation
      ? {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        }
      : undefined);

  const destinationCoords: LatLng | undefined = destination?.coords;
  const routeReady = !!route && !!originCoords && !!destinationCoords;

  
  useEffect(() => {
    void handleUseCurrentLocation();
  }, []);

  //selecting place selected from SearchPlace screen
  useEffect(() => {
    const sub = EventBus.addPlaceSelectedListener(
      async (place: PlaceSelectedPayload) => {
        const coords: LatLng = {
          latitude: place.lat,
          longitude: place.lon,
        };

        setDestination({
          coords,
          name: place.name,
          address: place.address,
        });

        if (originCoords) {
          await calculateRoute(originCoords, coords, mode);
        }
      }
    );

    return () => sub.remove();
  }, [originCoords, mode]);

  //get current gps + origin name
  const handleUseCurrentLocation = async () => {
    setLoadingLocation(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        setLoadingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setCurrentLocation(loc);

      const coords: LatLng = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      try {
        const info = await reverseGeocode(coords.latitude, coords.longitude);
        setOriginDetails({
          coords,
          name: info.name,
          address: info.address,
        });
      } catch {
        setOriginDetails({
          coords,
          name: "Your location",
          address: "Your location",
        });
      }
    } catch (e) {
      setError("Could not get current location");
    } finally {
      setLoadingLocation(false);
    }
  };

  //calculate route using OSRM
  const calculateRoute = async (
    origin: LatLng,
    dest: LatLng,
    transportMode: TransportMode = mode
  ) => {
    setLoadingRoute(true);
    setError(null);

    try {
      const result = await fetchRoute(origin, dest, transportMode);
      setRoute(result);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch route");
    } finally {
      setLoadingRoute(false);
    }
  };

  //mode change from RouteInfoCard
  const handleChangeMode = (nextMode: TransportMode) => {
    setMode(nextMode);

    if (originCoords && destinationCoords) {
      void calculateRoute(originCoords, destinationCoords, nextMode);
    }
  };

  //swap origin & destination
  const handleSwapRoute = () => {
    if (!originDetails || !destination) return;

    const oldOrigin = originDetails;
    const oldDestination = destination;

    setOriginDetails({
      coords: oldDestination.coords,
      name: oldDestination.name,
      address: oldDestination.address,
    });

    setDestination({
      coords: oldOrigin.coords,
      name: oldOrigin.name,
      address: oldOrigin.address,
    });

    void calculateRoute(oldDestination.coords, oldOrigin.coords, mode);

    // reset POIs on swap
    setSelectedPoiCategory(null);
    setPoiPlaces([]);
  };

  //When long-presses on map to select destination
  const handleSelectDestinationFromMap = async (coords: LatLng) => {
    try {
      const info = await reverseGeocode(coords.latitude, coords.longitude);

      const dest: DestinationDetails = {
        coords,
        name: info.name,
        address: info.address,
      };
      setDestination(dest);

      if (originCoords) {
        await calculateRoute(originCoords, coords, mode);
      }
    } catch {
      setDestination({
        coords,
        name: "Unknown place",
        address: "Unable to fetch address",
      });

      if (originCoords) {
        await calculateRoute(originCoords, coords, mode);
      }
    }

    //clear POIs when selecting a new destination
    setSelectedPoiCategory(null);
    setPoiPlaces([]);
  };

  //fetch nearby POIs via nominatim
  const fetchNearbyPoi = async (category: PoiCategory) => {
    const center = destinationCoords ?? originCoords;
    if (!center) return;

    setPoiLoading(true);

    try {
      const lat = center.latitude;
      const lon = center.longitude;

      // small bounding box around center (~1–2 km)
      const delta = 0.02;
      const viewbox = `${lon - delta},${lat - delta},${lon + delta},${
        lat + delta
      }`;

      const url =
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(category)}` +
        `&format=json&limit=20&viewbox=${viewbox}&bounded=1`;

      const res = await fetch(url, {
        headers: { "User-Agent": "ReactNativeLocationApp/1.0" },
      });

      const json = await res.json();

      const mapped: { coords: LatLng; name: string }[] = json.map(
        (item: any) => ({
          coords: {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          },
          name: item.display_name?.split(",")[0] ?? category,
        })
      );

      setPoiPlaces(mapped);
    } catch (e) {
      console.log("POI fetch error:", e);
    } finally {
      setPoiLoading(false);
    }
  };

  //toggle POI categor
  const handleTogglePoiCategory = (category: PoiCategory) => {
    if (selectedPoiCategory === category) {
      setSelectedPoiCategory(null);
      setPoiPlaces([]);
      return;
    }
    setSelectedPoiCategory(category);
    void fetchNearbyPoi(category);
  };

  const showDirectionHeader = !!destination && !!originCoords;

  const renderPoiChip = (category: PoiCategory, label: string, icon: string) => {
    const active = selectedPoiCategory === category;
    return (
      <TouchableOpacity
        key={category}
        style={[styles.poiChip, active && styles.poiChipActive]}
        onPress={() => handleTogglePoiCategory(category)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={icon as any}
          size={14}
          color={active ? "#1d4ed8" : "#6b7280"}
          style={{ marginRight: 4 }}
        />
        <Text style={[styles.poiChipText, active && styles.poiChipTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.root}>
        <MapRouteView
          origin={originCoords}
          destination={destinationCoords}
          routeCoords={route?.coordinates}
          onSelectDestination={handleSelectDestinationFromMap}
          poiMarkers={poiPlaces}      
        />

        
        <View style={styles.topOverlay}>
          {showDirectionHeader ? (
            <DirectionHeader
              originName={originDetails?.name ?? "Your location"}
              destinationName={destination?.name ?? "Destination"}
              onEditPress={() => router.push("/SearchPlace")}
              onSwapPress={handleSwapRoute}
            />
          ) : (
            <TouchableOpacity
              style={styles.searchBar}
              activeOpacity={0.8}
              onPress={() => router.push("/SearchPlace")}
            >
              <Ionicons
                name="search"
                size={22}
                color="#6b7280"
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  styles.searchText,
                  !destination?.name && { color: "#9ca3af" },
                ]}
                numberOfLines={1}
              >
                {destination?.name || "Search here..."}
              </Text>

              {loadingLocation && (
                <ActivityIndicator
                  size="small"
                  color={BLUE}
                  style={{ marginLeft: 8 }}
                />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* bottom info card + POI*/}
        {routeReady && (
          <RouteBottomSheet>
            {/* POI chips row */}
            <View style={styles.poiRow}>
              {renderPoiChip("restaurant", "Restaurants", "restaurant")}
              {renderPoiChip("cafe", "Cafes", "cafe")}
              {renderPoiChip("atm", "ATMs", "card-outline")}
              {poiLoading && (
                <ActivityIndicator size="small" color={BLUE} style={{ marginLeft: 8 }} />
              )}
            </View>

            <RouteInfoCard
              distanceKm={route?.distanceKm}
              durationText={route?.durationText}
              mode={mode}
              originSet={!!originCoords}
              destinationSet={!!destinationCoords}
              onModeChange={handleChangeMode}
            />
          </RouteBottomSheet>
        )}

        {error && (
          <View style={styles.errorBadge}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  root: {
    flex: 1,
  },

  topOverlay: {
    position: "absolute",
    top: 40,
    left: 12,
    right: 12,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },

  poiRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  poiChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    marginRight: 8,
    marginBottom: 6,
  },
  poiChipActive: {
    backgroundColor: "#dbeafe",
    borderColor: "#1d4ed8",
  },
  poiChipText: {
    fontSize: 12,
    color: "#4b5563",
  },
  poiChipTextActive: {
    color: "#1d4ed8",
    fontWeight: "600",
  },

  errorBadge: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 90,
    backgroundColor: "rgba(248,113,113,0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: "center",
  },
  errorText: {
    fontSize: 12,
    color: "#fff",
  },
});
