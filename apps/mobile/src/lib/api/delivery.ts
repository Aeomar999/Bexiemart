import { apiClient } from "./client";

export type VehicleType = "bike" | "car" | "van";

export interface DeliveryQuote {
  vehicleType: VehicleType;
  distanceMeters: number;
  durationSeconds: number;
  polyline: string | null;
  estimated: boolean;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  customerFee: number;
  platformCommission: number;
  driverPayout: number;
}

export interface CreateParcelJobInput {
  vehicleType: VehicleType;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
}

export interface DeliveryJob {
  id: string;
  jobNumber: string;
  type: "PARCEL" | "ORDER" | "FOOD";
  status: string;
  vehicleType: VehicleType;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  distanceMeters: number;
  durationSeconds: number;
  routePolyline: string | null;
  customerFee: string;
  driverPayout: string;
  customer?: { id: string; name: string; image: string | null };
  dispatcher?: {
    id: string;
    vehicleType: string;
    plateNumber: string;
    lastLatitude: number | null;
    lastLongitude: number | null;
    user: { id: string; name: string; image: string | null };
  } | null;
}

export const deliveryApi = {
  /** Quote all vehicle types for a route. */
  quoteAll: (coords: {
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
  }) => apiClient.post<DeliveryQuote[]>("/delivery/quote", coords),

  createJob: (input: CreateParcelJobInput) => apiClient.post<DeliveryJob>("/delivery/jobs", input),

  getJob: (id: string) => apiClient.get<DeliveryJob>(`/delivery/jobs/${id}`),

  myJobs: () => apiClient.get<{ jobs: DeliveryJob[]; meta: any }>("/delivery/jobs"),

  confirm: (id: string) => apiClient.post(`/delivery/jobs/${id}/confirm`, {}),

  cancel: (id: string) => apiClient.post(`/delivery/jobs/${id}/cancel`, {}),
};
