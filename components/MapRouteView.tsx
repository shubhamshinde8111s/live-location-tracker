import React, { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import MapView, {
  Marker,
  Polyline,
  LatLng,
  LongPressEvent,
  Region,
} from "react-native-maps";

type PoiMarker = {
  coords: LatLng;
  name: string;
};

type Props = {
  origin?: LatLng;
  destination?: LatLng;
  routeCoords?: LatLng[];
  onSelectDestination: (coords: LatLng) => void;
  poiMarkers?: PoiMarker[];
};

const MapRouteView: React.FC<Props> = ({
  origin,
  destination,
  routeCoords,
  onSelectDestination,
  poiMarkers,
}) => {
  const mapRef = useRef<MapView | null>(null);

  // Default lecoation
  const initialRegion: Region = origin
    ? {
        latitude: origin.latitude,
        longitude: origin.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }
    : {
        latitude: 18.5204,
        longitude: 73.8567,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };

  const handleLongPress = (e: LongPressEvent) => {
    onSelectDestination(e.nativeEvent.coordinate);
  };

  // zooming at starting app.
  useEffect(() => {
    if (!mapRef.current) return;

    const hasRoute = !!routeCoords && routeCoords.length > 1;
    const hasBothEnds = !!origin && !!destination;

    if (!hasRoute && !hasBothEnds) {
      return;
    }

    const coordsToFit: LatLng[] = [];

    if (hasRoute) {
      coordsToFit.push(...(routeCoords as LatLng[]));
    } else if (origin && destination) {
      coordsToFit.push(origin, destination);
    }

    if (coordsToFit.length === 0) return;

    mapRef.current.fitToCoordinates(coordsToFit, {
      edgePadding: {
        top: 80, 
        right: 40,
        bottom: 140, 
        left: 40,
      },
      animated: true,
    });
  }, [origin, destination, routeCoords]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        onLongPress={handleLongPress}
        showsUserLocation
        followsUserLocation
      >
        {origin && (
          <Marker
            coordinate={origin}
            title="Current location"
            pinColor="#1d4ed8"
          />
        )}

        {destination && (
          <Marker
            coordinate={destination}
            title="Destination"
            pinColor="#ef4444"
          />
        )}

        {routeCoords && routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="#1d4ed8"
          />
        )}

        {/* Nearby POIs */}
        {poiMarkers?.map((poi, index) => (
          <Marker
            key={`poi-${index}`}
            coordinate={poi.coords}
            title={poi.name}
            pinColor="#10b981"
          />
        ))}
      </MapView>
    </View>
  );
};

export default MapRouteView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
