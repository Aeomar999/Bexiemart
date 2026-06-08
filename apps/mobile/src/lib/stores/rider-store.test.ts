jest.unmock("@/lib/stores/rider-store");
import { useRiderStore } from "./rider-store";

describe("Rider Store", () => {
  beforeEach(() => {
    useRiderStore.setState({ activeRide: null });
  });

  it("should book a ride with searching status", () => {
    useRiderStore.getState().bookRide({ pickup: "Accra Mall", dropoff: "Airport", riderType: "standard", price: 50 });
    const ride = useRiderStore.getState().activeRide!;
    expect(ride.pickup).toBe("Accra Mall");
    expect(ride.dropoff).toBe("Airport");
    expect(ride.status).toBe("searching");
    expect(ride.id).toMatch(/^BXM-/);
  });

  it("should update ride status with extra data", () => {
    useRiderStore.getState().bookRide({ pickup: "A", dropoff: "B", riderType: "premium", price: 80 });
    useRiderStore.getState().updateStatus("on_the_way", { driverName: "John", driverVehicle: "Toyota", estimatedMinutes: 10 });
    const ride = useRiderStore.getState().activeRide!;
    expect(ride.status).toBe("on_the_way");
    expect(ride.driverName).toBe("John");
    expect(ride.estimatedMinutes).toBe(10);
  });

  it("should update status without extra data", () => {
    useRiderStore.getState().bookRide({ pickup: "A", dropoff: "B", riderType: "standard", price: 30 });
    useRiderStore.getState().updateStatus("arrived");
    expect(useRiderStore.getState().activeRide!.status).toBe("arrived");
  });

  it("should not update status when no active ride", () => {
    useRiderStore.getState().updateStatus("on_the_way", { driverName: "John" });
    expect(useRiderStore.getState().activeRide).toBeNull();
  });

  it("should cancel ride", () => {
    useRiderStore.getState().bookRide({ pickup: "A", dropoff: "B", riderType: "standard", price: 30 });
    useRiderStore.getState().cancelRide();
    expect(useRiderStore.getState().activeRide).toBeNull();
  });
});
