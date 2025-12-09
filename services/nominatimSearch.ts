export const searchPlaces = async (query: string) => {
  if (!query || query.length < 2) return [];

  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=8`;

  const res = await fetch(url, {
    headers: { "User-Agent": "ReactNativeLocationApp/1.0" },
  });

  return res.json();
};
