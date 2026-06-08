import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/vendor-documents", () => ({
  vendorDocumentsApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  },
}));;

import { useVendorDocuments, useUploadDocument, useDeleteDocument } from "../use-vendor-documents";
import { vendorDocumentsApi } from "../../api/vendor-documents";
import { createWrapper } from "./test-utils";

describe("useVendorDocuments", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch vendor documents on mount", async () => {
    (vendorDocumentsApi.getAll as jest.Mock).mockResolvedValue({ data: [{ id: "d1", name: "Business License.pdf", status: "verified" }] });
    const { result} = renderHook(() => useVendorDocuments(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "d1", name: "Business License.pdf", status: "verified" }]);
  });

  it("should handle fetch error", async () => {
    (vendorDocumentsApi.getAll as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useVendorDocuments(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useUploadDocument", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should upload document mutation", async () => {
    (vendorDocumentsApi.create as jest.Mock).mockResolvedValue({ data: { id: "d2", name: "ID.pdf", status: "pending" } });
    const { result} = renderHook(() => useUploadDocument(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ uri: "file:///id.pdf", name: "ID.pdf", type: "application/pdf" });
    expect(vendorDocumentsApi.create).toHaveBeenCalledWith({ uri: "file:///id.pdf", name: "ID.pdf", type: "application/pdf" });
  });
});
