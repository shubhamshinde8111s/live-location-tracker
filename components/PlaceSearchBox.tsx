import React, { useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface Props {
  onPlaceSelect: (place: {
    name: string;
    address: string;
    lat: number;
    lon: number;
  }) => void;
}

const PlaceSearchBox: React.FC<Props> = ({ onPlaceSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (text: string) => {
    setQuery(text);

    if (text.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const url =
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=8`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'ReactNativeLocationApp/1.0',
        },
      });

      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.log('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: any) => {
    onPlaceSelect({
      name: item.display_name.split(',')[0] || 'Selected place',
      address: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    });

    setQuery(item.display_name);
    setResults([]);
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search place..."
        value={query}
        onChangeText={search}
        style={styles.input}
      />

      {loading && <ActivityIndicator size="small" style={{ marginTop: 6 }} />}

      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.place_id.toString()}
          style={styles.dropdown}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelect(item)}
              style={styles.item}
            >
              <Text style={styles.itemTitle}>{item.display_name.split(',')[0]}</Text>
              <Text style={styles.itemSubtitle}>{item.display_name}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default PlaceSearchBox;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 6,
    maxHeight: 240,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  itemTitle: { fontSize: 14, fontWeight: '600', color: '#111' },
  itemSubtitle: { fontSize: 12, opacity: 0.6, marginTop: 2 },
});
