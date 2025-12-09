import { EventEmitter } from "expo-modules-core";

export type PlaceSelectedPayload = {
  name: string;
  address: string;
  lat: number;
  lon: number;
};

//event map
type AppEvents = {
  placeSelected: (payload: PlaceSelectedPayload) => void;
};

const emitter = new EventEmitter<AppEvents>();

export const EventBus = {
  emitPlaceSelected(payload: PlaceSelectedPayload) {
    emitter.emit("placeSelected", payload);
  },
  addPlaceSelectedListener(
    handler: (payload: PlaceSelectedPayload) => void
  ) {
    return emitter.addListener("placeSelected", handler);
  },
};
