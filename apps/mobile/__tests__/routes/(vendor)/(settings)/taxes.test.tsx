import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import TaxesDocumentsScreen from "../../../../app/(vendor)/(settings)/taxes";
import { useVendorProfile, useUpdateTaxInfo } from "@/lib/hooks/use-vendor";
import { useVendorDocuments } from "@/lib/hooks/use-vendor-documents";

jest.mock("@/lib/hooks/use-vendor", () => ({
  useVendorProfile: jest.fn(),
  useUpdateTaxInfo: jest.fn(),
}));

jest.mock("@/lib/hooks/use-vendor-documents", () => ({
  useVendorDocuments: jest.fn(),
  useUploadDocument: jest.fn(() => ({ mutate: jest.fn() })),
  useDeleteDocument: jest.fn(() => ({ mutate: jest.fn() })),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn() }),
}));

describe("TaxesDocumentsScreen", () => {
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUpdateTaxInfo as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it("renders status and existing TIN when vendor profile has pending status", () => {
    (useVendorProfile as jest.Mock).mockReturnValue({
      data: {
        taxId: "TIN-123456",
        taxStatus: "PENDING",
      },
      isLoading: false,
    });
    (useVendorDocuments as jest.Mock).mockReturnValue({
      data: [{ id: "doc-1", name: "business_registration.pdf", status: "VERIFIED" }],
      isLoading: false,
    });

    const { getByText, getByDisplayValue } = render(<TaxesDocumentsScreen />);
    expect(getByText("Status: PENDING")).toBeTruthy();
    expect(getByDisplayValue("TIN-123456")).toBeTruthy();
  });

  it("calls updateTaxInfo mutation on submit when TIN and documents exist", () => {
    (useVendorProfile as jest.Mock).mockReturnValue({
      data: {
        taxId: "TIN-123456",
        taxStatus: "NONE",
      },
      isLoading: false,
    });
    (useVendorDocuments as jest.Mock).mockReturnValue({
      data: [{ id: "doc-1", name: "tax_certificate.pdf", status: "PENDING" }],
      isLoading: false,
    });

    const { getByText } = render(<TaxesDocumentsScreen />);
    const submitBtn = getByText("Submit for Verification");
    fireEvent.press(submitBtn);

    expect(mockMutate).toHaveBeenCalledWith("TIN-123456", expect.any(Object));
  });
});
