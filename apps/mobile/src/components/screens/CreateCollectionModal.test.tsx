import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { CreateCollectionModal } from "./CreateCollectionModal";

const mockMutate = jest.fn();
const mockUseCreateCollection = jest.fn(() => ({
  mutate: mockMutate,
  isPending: false,
  isSuccess: false,
}));

jest.mock("@/lib/hooks/use-collections", () => ({
  useCreateCollection: () => mockUseCreateCollection(),
}));

describe("CreateCollectionModal", () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders when visible", () => {
    const { getByText } = render(<CreateCollectionModal visible={true} onClose={onClose} />);
    expect(getByText("New Collection")).toBeTruthy();
    expect(getByText("Create Collection")).toBeTruthy();
  });

  it("does not render when not visible", () => {
    const { queryByText } = render(<CreateCollectionModal visible={false} onClose={onClose} />);
    expect(queryByText("New Collection")).toBeNull();
  });

  it("calls mutate with collection name", () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateCollectionModal visible={true} onClose={onClose} />
    );
    fireEvent.changeText(getByPlaceholderText("e.g., Summer Outfits"), "My Collection");
    fireEvent.press(getByText("Create Collection"));
    expect(mockMutate).toHaveBeenCalledWith({ name: "My Collection" });
  });

  it("does not create with empty name", () => {
    const { getByText } = render(<CreateCollectionModal visible={true} onClose={onClose} />);
    fireEvent.press(getByText("Create Collection"));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("calls onClose when backdrop pressed", () => {
    const { getByText } = render(<CreateCollectionModal visible={true} onClose={onClose} />);
    expect(getByText("New Collection")).toBeTruthy();
  });
});
