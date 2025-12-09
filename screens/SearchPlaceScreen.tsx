import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { searchPlaces } from "@/services/nominatimSearch";
import { useDebounce } from "@/hooks/useDebounce";
import SearchSuggestionItem from "@/components/SearchSuggestionItem";

import type { StackScreenProps } from "@react-navigation/stack";

type RootStackParamList = {
  SearchPlaceScreen: { onPlaceSelected: (place: any) => void };
};

type Props = StackScreenProps<RootStackParamList, "SearchPlaceScreen">;

export default function SearchPlaceScreen({ navigation, route }: Props) {
  const { onPlaceSelected } = route.params;

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 350);

  type PlaceResult = { title: string; address: string; lat: number; lon: number };
  const [results, setResults] = useState<PlaceResult[]>([]);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    const fetch = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      const json: Array<{ display_name: string; lat: string; lon: string }> = await searchPlaces(debouncedQuery);

      const formatted = json.map((item) => ({
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
    };

    fetch();
  }, [debouncedQuery]);

  const handlePlacePress = (place: PlaceResult) => {
    onPlaceSelected(place); 
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>

        <TextInput
          placeholder="Search for a place..."
          value={query}
          onChangeText={setQuery}
          style={styles.input}
          autoFocus
        />

        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close" size={22} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-6, 0],
              }),
            },
          ],
          flex: 1,
        }}
      >
        <FlatList
          data={results}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <SearchSuggestionItem item={item} onPress={() => handlePlacePress(item)} />
          )}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },

  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#111",
  },
});
