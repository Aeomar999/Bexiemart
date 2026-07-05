import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { StatusBanner } from "./StatusBanner";

describe("StatusBanner", () => {
  it("renders title and subtitle", () => {
    const { getByText } = render(
      <StatusBanner icon="map" title="Delivery in progress" subtitle="Rider is arriving" />
    );
    expect(getByText("Delivery in progress")).toBeTruthy();
    expect(getByText("Rider is arriving")).toBeTruthy();
  });

  it("renders an action label and fires onPress", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <StatusBanner icon="map" title="Delivery" actionLabel="Track" onPress={onPress} />
    );
    fireEvent.press(getByText("Track"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("omits the action pill when no actionLabel is given", () => {
    const { queryByText } = render(<StatusBanner icon="calendar" title="Booking" />);
    expect(queryByText("Track")).toBeNull();
  });
});
