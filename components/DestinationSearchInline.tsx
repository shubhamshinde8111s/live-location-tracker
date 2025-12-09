import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  value?: string;
  onSelect: (place: {
    name: string;
    address: string;
    lat: number;
    lon: number;
  }) => void;
}

const DestinationSearchInline: React.FC<Props> = ({ value, onSelect }) => {
  const [query, setQuery] = useState(value ?? '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback((text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      performSearch(text);
    }, 400);
  }, []);

  const performSearch = async (text: string) => {
    if (text.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const url =
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(text)}&addressdetails=1&limit=8`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'ReactNativeLocationApp/1.0' },
      });

      const json = await res.json();
      setResults(json);
    } catch (err) {
      console.log('Autocomplete error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: results.length > 0 ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [results]);

  const highlightMatch = (text: string, search: string) => {
    const index = text.toLowerCase().indexOf(search.toLowerCase());
    if (index === -1) return <Text style={styles.title}>{text}</Text>;

    return (
      <Text style={styles.title}>
        {text.substring(0, index)}
        <Text style={styles.highlight}>{text.substring(index, index + search.length)}</Text>
        {text.substring(index + search.length)}
      </Text>
    );
  };

  const handleSelect = (item: any) => {
    const name = item.display_name.split(',')[0];

    onSelect({
      name,
      address: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    });

    setQuery(name);
    setResults([]);
  };

  return (
    <View style={{ width: '100%' }}>
      <View style={styles.inputRow}>
        <Ionicons name="search" size={18} color="#6b7280" style={{ marginRight: 6 }} />
        <TextInput
          placeholder="Search destination..."
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            debouncedSearch(text);
          }}
          style={styles.input}
        />

        {loading && <ActivityIndicator size="small" color="#1d4ed8" />}
      </View>
      {results.length > 0 && (
        <Animated.View
          style={[
            styles.dropdown,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-5, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <FlatList
            data={results}
            keyExtractor={(item) => item.place_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                {highlightMatch(item.display_name.split(',')[0], query)}
                <Text style={styles.subtitle}>{item.display_name}</Text>
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      )}
    </View>
  );
};

export default DestinationSearchInline;

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
    color: '#111827',
  },
  dropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 230,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  highlight: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
});
