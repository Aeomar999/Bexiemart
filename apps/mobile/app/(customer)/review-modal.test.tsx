import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import ReviewModalScreen from "./review-modal";
import { useCreateReview } from "@/lib/hooks/use-reviews";

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  useLocalSearchParams: () => ({ productId: "prod-101" }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 10 }),
}));

const mockMutate = jest.fn();
jest.mock("@/lib/hooks/use-reviews", () => ({
  useCreateReview: jest.fn(),
}));

jest.mock("@/lib/toast-polyfill", () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

describe("ReviewModalScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useCreateReview as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it("renders star rating and comment input cleanly without photo upload simulation", () => {
    render(<ReviewModalScreen />);

    expect(screen.getByText("Write a Review")).toBeTruthy();
    expect(screen.getByText("How would you rate this product?")).toBeTruthy();
    expect(screen.getByText("Your Review")).toBeTruthy();
    expect(
      screen.getByPlaceholderText(
        "What did you like or dislike? What did you use this product for?"
      )
    ).toBeTruthy();

    // Verify photo upload UI is absent
    expect(screen.queryByText("Add Photos (Optional)")).toBeNull();
    expect(screen.queryByText("Tap to upload photos")).toBeNull();
  });

  it("submits review with rating and comment when submit button is pressed", () => {
    render(<ReviewModalScreen />);

    // Select 4 stars
    const starBtn = screen.getByLabelText("Rate 4 stars");
    fireEvent.press(starBtn);

    // Enter comment
    const input = screen.getByPlaceholderText(
      "What did you like or dislike? What did you use this product for?"
    );
    fireEvent.changeText(input, "Great product! Works as expected.");

    // Press submit
    const submitBtn = screen.getByText("Submit Review");
    fireEvent.press(submitBtn);

    expect(mockMutate).toHaveBeenCalledWith(
      { productId: "prod-101", rating: 4, comment: "Great product! Works as expected." },
      expect.any(Object)
    );
  });
});
