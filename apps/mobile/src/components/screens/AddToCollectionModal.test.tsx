import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { AddToCollectionModal } from "./AddToCollectionModal";

const mockMutateAsync = jest.fn();
const mockUseCollections = jest.fn(() => ({
  data: [
    { id: "1", name: "Favorites" },
    { id: "2", name: "Summer Picks" },
  ],
}));
const mockUseAddCollectionItem = jest.fn(() => ({
  mutateAsync: mockMutateAsync,
  isPending: false,
}));

jest.mock("@/lib/hooks/use-collections", () => ({
  useCollections: () => mockUseCollections(),
  useAddCollectionItem: () => mockUseAddCollectionItem(),
}));

describe("AddToCollectionModal", () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders when visible", () => {
    const { getByText } = render(
      <AddToCollectionModal visible={true} productId="prod-1" onClose={onClose} />
    );
    expect(getByText("Save to Collection")).toBeTruthy();
    expect(getByText("Favorites")).toBeTruthy();
    expect(getByText("Summer Picks")).toBeTruthy();
  });

  it("does not render when not visible", () => {
    const { queryByText } = render(
      <AddToCollectionModal visible={false} productId="prod-1" onClose={onClose} />
    );
    expect(queryByText("Save to Collection")).toBeNull();
  });

  it("calls addItem when collection selected", async () => {
    mockMutateAsync.mockResolvedValue(undefined);

    const { getByText } = render(
      <AddToCollectionModal visible={true} productId="prod-1" onClose={onClose} />
    );
    fireEvent.press(getByText("Favorites"));
    expect(mockMutateAsync).toHaveBeenCalledWith({ collectionId: "1", productId: "prod-1" });
  });

  it("shows empty state when no collections", () => {
    mockUseCollections.mockReturnValue({ data: [] });
    const { getByText } = render(
      <AddToCollectionModal visible={true} productId="prod-1" onClose={onClose} />
    );
    expect(getByText("You haven't created any collections yet. Create one first!")).toBeTruthy();
  });
});
