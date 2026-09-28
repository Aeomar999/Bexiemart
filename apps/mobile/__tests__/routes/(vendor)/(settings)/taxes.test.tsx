import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import TaxesDocumentsScreen from "../../../../app/(vendor)/(settings)/taxes";
import { useVendorProfile, useUpdateTaxInfo } from "@/lib/hooks/use-vendor";
import { useVendorDocuments, useUploadDocument } from "@/lib/hooks/use-vendor-documents";
import { uploadApi } from "@/lib/api/upload";
import * as DocumentPicker from "expo-document-picker";
import { Alert } from "react-native";

jest.mock("@/lib/hooks/use-vendor", () => ({
  useVendorProfile: jest.fn(),
  useUpdateTaxInfo: jest.fn(),
}));

jest.mock("@/lib/hooks/use-vendor-documents", () => ({
  useVendorDocuments: jest.fn(),
  useUploadDocument: jest.fn(() => ({ mutateAsync: jest.fn() })),
  useDeleteDocument: jest.fn(() => ({ mutate: jest.fn() })),
}));

jest.mock("@/lib/api/upload", () => ({
  uploadApi: { uploadDocument: jest.fn() },
  uploadErrorMessage: (e: any, fallback: string) => e?.userMessage ?? fallback,
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

  it("renders status and existing TIN when vendor profile has pending status", async () => {
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

    await waitFor(() => {
      expect(getByText("Status: PENDING")).toBeTruthy();
      expect(getByDisplayValue("TIN-123456")).toBeTruthy();
    });
  });

  it("calls updateTaxInfo mutation on submit when TIN and documents exist", async () => {
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

    const { getByText, getByDisplayValue } = render(<TaxesDocumentsScreen />);

    await waitFor(() => {
      expect(getByDisplayValue("TIN-123456")).toBeTruthy();
    });

    const submitBtn = getByText("Submit for Verification");
    fireEvent.press(submitBtn);

    expect(mockMutate).toHaveBeenCalledWith("TIN-123456", expect.any(Object));
  });

  describe("document upload", () => {
    const mutateAsync = jest.fn();

    beforeEach(() => {
      (useVendorProfile as jest.Mock).mockReturnValue({
        data: { taxId: "", taxStatus: "NONE" },
        isLoading: false,
      });
      (useVendorDocuments as jest.Mock).mockReturnValue({ data: [], isLoading: false });
      (useUploadDocument as jest.Mock).mockReturnValue({ mutateAsync });
      jest.spyOn(Alert, "alert").mockImplementation(() => {});
    });

    it("uploads a picked PDF and records it against the vendor", async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [
          { uri: "file:///cert.pdf", name: "cert.pdf", mimeType: "application/pdf", size: 2048 },
        ],
      });
      (uploadApi.uploadDocument as jest.Mock).mockResolvedValueOnce({
        url: "https://cdn/raw/private/cert.pdf",
      });
      mutateAsync.mockResolvedValueOnce({ id: "doc-1" });

      const { getByText } = render(<TaxesDocumentsScreen />);
      fireEvent.press(getByText("Tap to Upload"));
      fireEvent.press(getByText("Browse Files"));

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          name: "cert.pdf",
          url: "https://cdn/raw/private/cert.pdf",
          type: "business_document",
        });
      });
      expect(uploadApi.uploadDocument).toHaveBeenCalledWith(
        expect.objectContaining({ uri: "file:///cert.pdf", type: "application/pdf" })
      );
      expect(Alert.alert).toHaveBeenCalledWith("Success", "Document uploaded successfully.");
    });

    it("rejects PDFs over 10MB without uploading", async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            uri: "file:///big.pdf",
            name: "big.pdf",
            mimeType: "application/pdf",
            size: 11 * 1024 * 1024,
          },
        ],
      });

      const { getByText } = render(<TaxesDocumentsScreen />);
      fireEvent.press(getByText("Tap to Upload"));
      fireEvent.press(getByText("Browse Files"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("File too large", "Documents must be under 10MB.");
      });
      expect(uploadApi.uploadDocument).not.toHaveBeenCalled();
      expect(mutateAsync).not.toHaveBeenCalled();
    });

    it("does nothing when the picker is cancelled", async () => {
      const { getByText } = render(<TaxesDocumentsScreen />);
      fireEvent.press(getByText("Tap to Upload"));
      fireEvent.press(getByText("Browse Files"));

      await waitFor(() => expect(DocumentPicker.getDocumentAsync).toHaveBeenCalled());
      expect(uploadApi.uploadDocument).not.toHaveBeenCalled();
    });
  });
});
