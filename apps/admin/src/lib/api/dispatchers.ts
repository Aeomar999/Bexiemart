import { apiClient } from "./client";

export interface Dispatcher {
  id: string;
  userId: string;
  vehicleType: string;
  plateNumber: string;
  drivingLicense: string | null;
  status: string;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastLocationAt: string | null;
  totalEarnings: string;
  pendingPayout: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    phoneNumber: string | null;
  };
  totalTrips: number;
}

export interface DispatcherDetails extends Dispatcher {
  stats: {
    totalRides: number;
    totalDeliveries: number;
  };
  rides: any[];
  deliveries: any[];
}

export interface Delivery {
  id: string;
  customerId: string;
  dispatcherId: string | null;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  price: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    phoneNumber: string | null;
  };
  dispatcher: {
    id: string;
    vehicleType: string;
    plateNumber: string;
    user: {
      name: string;
    };
  } | null;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const dispatchersApi = {
  getDispatchers: async (params?: Record<string, any>) => {
    const { data } = await apiClient.get<PaginatedResponse<Dispatcher>>("/admin/dispatchers", {
      params,
    });
    return data;
  },

  getDispatcher: async (id: string) => {
    const { data } = await apiClient.get<DispatcherDetails>(`/admin/dispatchers/${id}`);
    return data;
  },

  updateStatus: async (id: string, status: string) => {
    const { data } = await apiClient.patch<{ status: string }>(`/admin/dispatchers/${id}/status`, { status });
    return data;
  },

  getDeliveries: async (page = 1, limit = 20, status?: string) => {
    const { data } = await apiClient.get<PaginatedResponse<Delivery>>("/admin/deliveries", {
      params: { page, limit, status },
    });
    return data;
  },
};
