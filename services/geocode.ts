export async function reverseGeocode(lat: number, lon: number) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?` +
    `format=json&addressdetails=1&zoom=18&lat=${lat}&lon=${lon}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "ReactNativeLocationApp/1.0",
    },
  });

  if (!res.ok) {
    return {
      name: "Nearest location",
      address: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
    };
  }

  const data = await res.json();
  const address = data.address || {};

  //PRIORITY: real POI (restaurant,cafe,ATM)
  const poi =
    data.name ||
    address.attraction ||
    address.building ||
    address.cafe ||
    address.shop ||
    address.office ||
    address.public_building ||
    null;

  const area =
    address.neighbourhood ||
    address.suburb ||
    address.village ||
    address.town ||
    address.city ||
    null;

  const road =
    address.road ||
    address.street ||
    address.residential ||
    null;

  let placeName =
    poi ||
    area ||
    road ||
    "Nearby Area";

  const fullAddress = data.display_name || `${lat}, ${lon}`;
  if (!poi && !area && !road) {
    placeName = "Nearest landmark";
  }

  return {
    name: placeName,
    address: fullAddress,
  };
}
